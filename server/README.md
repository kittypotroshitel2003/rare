# Обработчик заявок `rare-leads`

Все формы сайта отправляют заявку на `POST /api/lead` (`js/leads.js`). Caddy
проксирует этот путь на `127.0.0.1:8791` (опция `api` в `deploy.config.json`),
а там работает `rare-leads.py`. Каждую заявку он сначала дописывает в
`~/rare-leads/leads.jsonl`, потом шлёт письмо на `MAIL_TO` и создаёт в
Клиентиксе клиента (или находит его по телефону) и запись в листе ожидания.

Нужен только `python3` из системы, сторонних пакетов нет.

## Установка (один раз, под пользователем deploy, без sudo)

Как и другие обработчики форм на этом сервере, работает от deploy и
поднимается сторожем из cron:

```sh
mkdir -p ~/rare-leads && cd ~/rare-leads
# сюда: rare-leads.py, watchdog.sh, .env (из rare-leads.env.example, chmod 600)
(crontab -l; echo '* * * * * /home/deploy/rare-leads/watchdog.sh >/dev/null 2>&1'; \
 echo '@reboot /home/deploy/rare-leads/watchdog.sh >/dev/null 2>&1') | crontab -
./watchdog.sh
```

После правки `.env` или `rare-leads.py` перезапуск: `kill $(cat rare-leads.pid)`,
через минуту сторож поднимет его заново (или сразу `./watchdog.sh`).

Потом `node deploy.js` — он добавит в конфиг Caddy строку `reverse_proxy /api/lead 127.0.0.1:8791`.

## Проверка

```sh
tail -f ~/rare-leads/rare-leads.log    # «почта — ок», «CRM — ок» по каждой заявке
tail ~/rare-leads/leads.jsonl          # все принятые заявки
```

## Запуск сайта на rare-anapa.ru

1. В `deploy.config.json`: `domain` → `rare-anapa.ru`, убрать `basicAuth`, добавить `"wwwRedirect": true`.
2. `node deploy.js`, затем переключить DNS `rare-anapa.ru` и `www` на этот сервер.
3. Тестовый `rare.a-4-to.ru` либо оставить под паролем, либо заменить его конфиг Caddy на
   `redir https://rare-anapa.ru{uri} 301`. Одного `Disallow: /` для этого мало.
4. В Вебмастере проверить права (файл `yandex_b26cfa7a87bf2abb.html` уже в корне) и
   отправить на переобход `https://rare-anapa.ru/sitemap.xml`.
