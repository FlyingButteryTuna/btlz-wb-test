# WB Box Tariffs -> PostgreSQL -> Google Sheets

Сервис получает тарифы WB для коробов и:

1.  **каждый час** тянет данные по API и накапливает их в PostgreSQL **по дням**;
2.  **каждый час +5 минут** выгружает «актуальные на сегодня» данные в Google Sheets на лист `stocks_coefs` для всех таблиц из списка в БД.

---

## Установка и запуск

### 1) `.env`

Скопируйте `.env.example` -> `.env` и заполните:

```env
# ---------- Postgres ----------
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=appdb
POSTGRES_USER=app
POSTGRES_PASSWORD=app

# ---------- App ----------
APP_PORT=3000
NODE_ENV=production

# ---------- WB API ----------
# только сам токен
WB_API_KEY=<ВАШ_WB_ТОКЕН>

# ---------- Google Service Account ----------
GOOGLE_PROJECT_ID=<ваш_gcp_project_id>
GOOGLE_CLIENT_EMAIL=<service-account>@<project>.iam.gserviceaccount.com
# ключ в одну строку с \n, либо многострочно
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ---------- Идентификаторы Google Sheets (через запятую) ----------
# из ссылки docs.google.com/spreadsheets/d/<ID>/edit
TEST_SPREADSHEET_IDS=1XNUnlH_DV_OJG6rz3brAkFVVD1_LDW_cVAB8hf0wyQk
```

### 2) Дайте доступ сервисному аккаунту к таблицам

Откройте каждую Google-таблицу -> **Share** -> добавьте `GOOGLE_CLIENT_EMAIL` как **Editor**.  
Если листа `stocks_coefs` нет - код его создаст автоматически.

### 3) Запуск в Docker

```bash
docker compose down --rmi local --volumes
docker compose up --build
```

- Поднимется `postgres` -> запустится `app`
- При старте `app` выполнит **миграции и сиды**
- Выполнится **первичный** сбор WB и выгрузка в Sheets
- Далее по расписанию: WB каждый час (мин:00), Sheets каждый час (мин:05)

---

## Внутренности

### Расписание (внутри приложения)

- `fetch WB`: **каждый час** (минуты `00`).  
  Запрашивает `GET https://common-api.wildberries.ru/api/v1/tariffs/box?date=YYYY-MM-DD` с заголовком `Authorization: <WB_API_KEY>`.  
  Записывает в БД таблицу `daily_box_tariffs` при помощи UPSERT по `(date, warehouse_name)`:

    - внутри дня - **UPDATE** существующих строк (свежие коэффициенты перезаписывают старые);
    - на следующий день - **INSERT** новых строк.

- `update Sheets`: **каждый час** (минуты `05`).  
  Берёт строки за **сегодняшнюю дату** из `daily_box_tariffs`,
  сортирует по **возрастанию по box_delivery_coef_expr (если есть данное значение, есть нет то по box_delivery_marketplace_coef_expr**).

    Форматирует дату как `YYYY-MM-DD`, числовые `NULL` экспортирует как `"-"`.
    Пишет результат на лист `stocks_coefs` всех таблиц из БД (`spreadsheets`).

### Структура БД

- `spreadsheets(spreadsheet_id text primary key)` - список Google-таблиц, куда выгружать.
- `daily_box_tariffs`:

    - `date date` + `warehouse_name text` - **PRIMARY KEY**
    - `geo_name text`
    - числовые поля (`numeric`), допускают `NULL`:

        - `box_delivery_base`, `box_delivery_coef_expr`, `box_delivery_liter`
        - `box_delivery_marketplace_base`, `box_delivery_marketplace_coef_expr`, `box_delivery_marketplace_liter`
        - `box_storage_base`, `box_storage_coef_expr`, `box_storage_liter`

    - `updated_at timestamptz default now()`

### Нормализация чисел

- WB присылает числа как строки с запятой (`"11,2"`) или **`"-"`**.
- Репозиторий перед вставкой приводит их к `number | null`:

    - `"-"`, пустая строка, `undefined`/`null` -> `NULL` в БД;
    - запятая меняется на точку;

### Экспорт в Google Sheets

- Создаётся (если нет) лист `stocks_coefs`.
- Очищается диапазон `A:Z`.
- Пишутся заголовки и строки. Дата - `YYYY-MM-DD`. Пустые числа - `"-"`.

---

## Добавление / обновление списка таблиц

Обновите `TEST_SPREADSHEET_IDS` в `.env` (через запятую), затем перезапустите контейнер `app`:

```bash
docker compose up -d --force-recreate app
```

Сид при старте **добавит новые** ID и **удалит** старые (которых больше нет в .env)
