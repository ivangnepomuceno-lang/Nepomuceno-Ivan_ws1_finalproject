# ICCT Clubs: XAMPP + MySQL version

Ang version na ito ay gumagamit ng **PHP at MySQL** (XAMPP), kaya ang mga account, membership, at announcement
ay nasa database at makikita ng lahat ng gumagamit, hindi lang sa isang browser.

## 1. Ihanda ang XAMPP
1. Buksan ang **XAMPP Control Panel**.
2. I-**Start** ang **Apache** at **MySQL** (dapat berde ang dalawa).

## 2. Ilagay ang project sa htdocs
1. Kopyahin ang buong folder na `icct-clubs` sa `C:\xampp\htdocs\`.
   Dapat ganito ang kalalabasan: `C:\xampp\htdocs\icct-clubs\index.html`.
2. Kopyahin mula sa dati mong project papunta sa bagong folder:
   - ang buong folder na `image` (mga logo at picture ng club)
   - ang `pexels-pixabay-159650.jpg` (background)

## 3. Gawin ang database
1. Buksan sa browser: http://localhost/phpmyadmin
2. I-click ang **Import** (sa taas) -> **Choose File** -> piliin ang `database/schema.sql` -> **Go**.
3. Dapat may lumabas na database na `icct_clubs` na may tatlong table: `users`, `memberships`, `announcements`.

## 4. I-check ang settings
Buksan ang `api/config.php`:
- Kung default ang XAMPP mo (user `root`, walang password), wala kang babaguhin.
- Kung may password ang MySQL mo, ilagay sa `DB_PASS`.
- Sa `ADMIN_EMAILS`, ilagay ang email na gagamitin mo sa signup para maging admin.
  Para sa officer ng isang club lang, gamitin ang `CLUB_OFFICERS`.

## 5. Buksan ang website
http://localhost/icct-clubs/

> Huwag nang gamitin ang Live Server (127.0.0.1:5500). Hindi nito mapapatakbo ang PHP.
> Palaging gamitin ang `http://localhost/icct-clubs/`.

Mag-signup muna, tapos mag-login. Ang mga account sa dating localStorage version ay hindi na kasama, kaya gumawa ulit.

## Pag-check kung gumagana ang server
Buksan: http://localhost/icct-clubs/api/me.php
Dapat may lumabas na parang ito:
`{"ok":true,"user":null,"isAdmin":false,"officerClubs":[],"memberships":{}}`

## Mga posibleng problema
| Mensahe / problema | Gagawin |
|---|---|
| "Cannot reach the server" o "invalid response" | Hindi XAMPP ang binubuksan mo. Gamitin ang `http://localhost/icct-clubs/`. |
| "Cannot connect to the database" | Naka-start ba ang MySQL? Na-import ba ang `schema.sql`? Tama ba ang `DB_PASS` sa `api/config.php`? |
| Nakikita mo ang PHP code sa browser | Hindi tumatakbo ang Apache, o hindi sa `htdocs` ang folder. |
| Hindi nakaka-upload ng picture sa announcement | Tingnan kung may `uploads/announcements` folder. Ang limit ng picture ay 3 MB. |
| Walang "Admin panel" | Ang email mo ay dapat nasa `ADMIN_EMAILS` (o `CLUB_OFFICERS`) sa `api/config.php`. Mag-login ulit pagkatapos baguhin. |

## Ano ang nasa database
- **users**: firstname, email, password (naka-hash, hindi nababasa)
- **memberships**: laman ng join form ng bawat sumali
- **announcements**: mga announcement at ang path ng picture (ang mga picture ay nasa `uploads/announcements/`)

Ang mga club mismo (pangalan, logo, members picture, activities) ay nasa `clubs.js` pa rin.

## Paalala sa seguridad
Okay ito para sa school project at lokal na paggamit. Bago ito ilagay sa totoong internet:
gamitin ang HTTPS, palitan ang password ng MySQL `root`, at gumawa ng hiwalay na MySQL user para sa website.
