#!/usr/bin/env python3
"""Приём заявок с сайта RA|RÉ: письмо на почту клиники + дубль в CRM Клиентикс.

Слушает 127.0.0.1:$PORT, Caddy проксирует сюда POST /api/lead.
Только стандартная библиотека Python 3 — на сервере больше ничего ставить не нужно.

Каждая заявка сначала дописывается в leads.jsonl (чтобы не потерялась, даже если
почта или CRM недоступны), посетителю сразу отвечаем «ок», а письмо и CRM
отрабатывают в фоне с повторами.

Настройки — переменные окружения (см. server/rare-leads.env.example).
"""

import json
import os
import re
import smtplib
import ssl
import threading
import time
import urllib.parse
import urllib.request
from collections import defaultdict, deque
from datetime import datetime, timezone, timedelta
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ENV = os.environ
PORT = int(ENV.get("PORT", "8791"))
LOG_FILE = ENV.get("LEADS_LOG", "/home/deploy/rare-leads/leads.jsonl")
ALLOWED_ORIGINS = {o.strip() for o in ENV.get("ALLOWED_ORIGINS", "https://rare-anapa.ru").split(",") if o.strip()}

MAIL_TO = ENV.get("MAIL_TO", "mindal.anapa@yandex.ru")
SMTP_HOST = ENV.get("SMTP_HOST", "smtp.yandex.ru")
SMTP_PORT = int(ENV.get("SMTP_PORT", "465"))
SMTP_USER = ENV.get("SMTP_USER", "")
SMTP_PASS = ENV.get("SMTP_PASS", "")

KL_ACCOUNT = ENV.get("KLIENTIKS_ACCOUNT_ID", "")
KL_USER = ENV.get("KLIENTIKS_USER_ID", "")
KL_TOKEN = ENV.get("KLIENTIKS_TOKEN", "")
KL_BASE = "https://klientiks.ru/clientix/Restapi"
KL_SOURCE = ENV.get("KLIENTIKS_SOURCE", "Сайт rare-anapa.ru")
# кому падает задача; пусто — задача без исполнителя, её видят все пользователи (так попросила клиника)
KL_TASK_EXECUTOR = ENV.get("KLIENTIKS_TASK_EXECUTOR", "")

MSK = timezone(timedelta(hours=3))
MAX_BODY = 16 * 1024
RATE_WINDOW, RATE_MAX = 600, 6  # не больше 6 заявок с одного IP за 10 минут
_hits = defaultdict(deque)
_log_lock = threading.Lock()


class NotConfigured(Exception):
    """Канал (почта или CRM) не настроен в .env — повторять бессмысленно."""


def log(msg):
    print(f"[{datetime.now(MSK):%Y-%m-%d %H:%M:%S}] {msg}", flush=True)


def clean(value, limit=500):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:limit]


def normalize_phone(raw):
    digits = re.sub(r"\D", "", raw or "")
    if len(digits) == 11 and digits[0] in "78":
        return "7" + digits[1:]
    if len(digits) == 10:
        return "7" + digits
    return None


def pretty_phone(p):
    return f"+7 ({p[1:4]}) {p[4:7]}-{p[7:9]}-{p[9:11]}"


# ── почта ────────────────────────────────────────────────────────────────
def send_mail(lead):
    if not (SMTP_USER and SMTP_PASS):
        raise NotConfigured("SMTP не настроен")
    subject = "Заявка с сайта" + (f": {lead['service']}" if lead["service"] else "")
    lines = [
        f"Имя: {lead['name'] or '—'}",
        f"Телефон: {pretty_phone(lead['phone'])}",
    ]
    if lead["service"]:
        lines.append(f"Услуга: {lead['service']}")
    if lead["comment"]:
        lines.append(f"Комментарий: {lead['comment']}")
    lines += [
        "",
        f"Форма: {lead['form'] or '—'}",
        f"Страница: {lead['page_title'] or ''} {lead['page']}".strip(),
        f"Время: {lead['received']}",
    ]
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"Сайт RA|RÉ <{SMTP_USER}>"
    msg["To"] = MAIL_TO
    msg.set_content("\n".join(lines))
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=ssl.create_default_context(), timeout=20) as s:
        s.login(SMTP_USER, SMTP_PASS)
        s.send_message(msg)


# ── Клиентикс ────────────────────────────────────────────────────────────
def kl_request(action, model_path, data=None):
    url = f"{KL_BASE}/{action}/a/{KL_ACCOUNT}/u/{KL_USER}/{model_path}"
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers={"Authorization": f"Bearer {KL_TOKEN}"})
    if body is not None:
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urllib.request.urlopen(req, timeout=20) as r:
        payload = json.loads(r.read().decode("utf-8"))
    time.sleep(0.6)  # API: не больше двух запросов в секунду на аккаунт
    return payload


def send_crm(lead):
    if not (KL_ACCOUNT and KL_USER and KL_TOKEN):
        raise NotConfigured("Клиентикс не настроен")
    found = kl_request("list", f"m/getClientByPhone/phone/{lead['phone']}")
    client_id = found.get("id") if isinstance(found, dict) else None
    if not client_id:
        created = kl_request("add", "m/Clients/", {
            "phone": lead["phone"],
            "first_name": lead["name"] or "Без имени",
            "lead_source": KL_SOURCE,
        })
        client_id = (created.get("object") or {}).get("id")
        if not client_id:
            raise RuntimeError(f"не удалось создать клиента: {created}")
    res = kl_request("add", "m/Appointments/s/waitingListItemAdd", {
        "client_id": client_id,
        "start_datetime": datetime.now(MSK).strftime("%Y-%m-%d"),
        "client_memo": crm_memo(lead),
        "appointment_source": KL_SOURCE,
    })
    if not res.get("status"):
        raise RuntimeError(f"лист ожидания: {res}")


def crm_memo(lead):
    return " · ".join(x for x in [
        "Заявка с сайта",
        f"{lead['name'] or 'Без имени'}, {pretty_phone(lead['phone'])}",
        lead["service"] and f"Услуга: {lead['service']}",
        lead["comment"] and f"Комментарий: {lead['comment']}",
        lead["form"] and f"Форма: {lead['form']}",
        lead["page"],
    ] if x)


def send_crm_task(lead):
    """Задача администратору — она и даёт уведомление в Клиентиксе.
    Отдельным шагом, чтобы повтор при сбое не плодил записи в листе ожидания."""
    if not (KL_ACCOUNT and KL_USER and KL_TOKEN):
        raise NotConfigured("задачи Клиентикса не настроены")
    res = kl_request("add", "m/Clients/m/Notifications/", {
        "executor_id": KL_TASK_EXECUTOR,
        "client_phone": lead["phone"],
        "planed_execution_datetime": datetime.now(MSK).strftime("%Y-%m-%d %H:%M:%S"),
        "heading": "Заявка с сайта" + (f": {lead['service']}" if lead["service"] else ""),
        "message": crm_memo(lead),
    })
    if not res.get("status"):
        raise RuntimeError(f"задача: {res}")


def deliver(lead):
    for name, fn in (("почта", send_mail), ("CRM", send_crm), ("задача CRM", send_crm_task)):
        for attempt in range(1, 4):
            try:
                fn(lead)
                log(f"{lead['id']}: {name} — ок")
                break
            except NotConfigured as e:
                log(f"{lead['id']}: {name} — пропущено: {e}")
                break
            except Exception as e:  # noqa: BLE001 — любая ошибка = повтор, потом в лог
                log(f"{lead['id']}: {name} — ошибка (попытка {attempt}): {e}")
                time.sleep(5 * attempt)


# ── HTTP ─────────────────────────────────────────────────────────────────
class Handler(BaseHTTPRequestHandler):
    server_version = "rare-leads"

    def _cors(self):
        origin = self.headers.get("Origin", "")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")

    def _reply(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Access-Control-Allow-Methods", "POST")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/lead":
            return self._reply(404, {"ok": False})
        origin = self.headers.get("Origin", "")
        if origin and origin not in ALLOWED_ORIGINS:
            return self._reply(403, {"ok": False, "error": "origin"})

        ip = (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()
        now = time.time()
        q = _hits[ip]
        while q and now - q[0] > RATE_WINDOW:
            q.popleft()
        if len(q) >= RATE_MAX:
            return self._reply(429, {"ok": False, "error": "Слишком много заявок подряд. Позвоните нам: +7 (900) 276-11-16"})

        length = int(self.headers.get("Content-Length") or 0)
        if not 0 < length <= MAX_BODY:
            return self._reply(400, {"ok": False, "error": "body"})
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return self._reply(400, {"ok": False, "error": "json"})

        # скрытое поле-ловушка: человек его не видит и не заполняет
        if clean(data.get("website")):
            return self._reply(200, {"ok": True})

        phone = normalize_phone(data.get("phone"))
        if not phone:
            return self._reply(422, {"ok": False, "error": "Проверьте номер телефона"})

        q.append(now)
        lead = {
            "id": f"{int(now * 1000):x}",
            "received": datetime.now(MSK).strftime("%d.%m.%Y %H:%M"),
            "name": clean(data.get("name"), 100),
            "phone": phone,
            "service": clean(data.get("service"), 200),
            "comment": clean(data.get("comment"), 1000),
            "form": clean(data.get("form"), 200),
            "page": clean(data.get("page"), 300),
            "page_title": clean(data.get("page_title"), 200),
            "ip": ip,
        }
        with _log_lock, open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(lead, ensure_ascii=False) + "\n")
        threading.Thread(target=deliver, args=(lead,), daemon=True).start()
        log(f"{lead['id']}: заявка принята ({lead['form'] or 'форма'})")
        return self._reply(200, {"ok": True})

    def log_message(self, *args):  # access-лог ведёт Caddy
        pass


if __name__ == "__main__":
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    log(f"rare-leads слушает 127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
