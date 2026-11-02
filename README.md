# ICCT Clubs: XAMPP + MySQL version

This version uses **PHP and MySQL** (XAMPP), so accounts, memberships, and announcements
are stored in the database and visible to all users, not just in one browser.

## 1. Prepare XAMPP
1. Open the **XAMPP Control Panel**.
2. **Start** both **Apache** and **MySQL** (both should be green).

## 2. Put the project in htdocs
1. Copy the whole `icct-clubs` folder into `C:\xampp\htdocs\`.
   The result should be: `C:\xampp\htdocs\icct-clubs\index.html`.
2. Copy the following from your old project into the new folder:
   - the whole `image` folder (club logos and pictures)
   - `pexels-pixabay-159650.jpg` (background)

## 3. Create the database
1. Open in your browser: http://localhost/phpmyadmin
2. Click **Import** (at the top) -> **Choose File** -> select `database/schema.sql` -> **Go**.
3. A database named `icct_clubs` should appear with three tables: `users`, `memberships`, `announcements`.

## 4. Check the settings
Open `api/config.php`:
- If your XAMPP is default (user `root`, no password), you don't need to change anything.
- If your MySQL has a password, put it in `DB_PASS`.
- In `ADMIN_EMAILS`, put the email you will use at signup to become an admin.
  For an officer of a single club only, use `CLUB_OFFICERS`.

## 5. Open the website
http://localhost/icct-clubs/

> Don't use Live Server (127.0.0.1:5500) anymore. It can't run PHP.
> Always use `http://localhost/icct-clubs/`.

Sign up first, then log in. Accounts from the old localStorage version are not carried over, so create them again.

## Checking if the server works
Open: http://localhost/icct-clubs/api/me.php
You should see something like this:
`{"ok":true,"user":null,"isAdmin":false,"officerClubs":[],"memberships":{}}`

## Possible problems
| Message / problem | What to do |
|---|---|
| "Cannot reach the server" or "invalid response" | You're not opening it through XAMPP. Use `http://localhost/icct-clubs/`. |
| "Cannot connect to the database" | Is MySQL started? Was `schema.sql` imported? Is `DB_PASS` in `api/config.php` correct? |
| You see the PHP code in the browser | Apache is not running, or the folder is not in `htdocs`. |
| Can't upload a picture in an announcement | Check that the `uploads/announcements` folder exists. The picture size limit is 3 MB. |
| No "Admin panel" | Your email must be in `ADMIN_EMAILS` (or `CLUB_OFFICERS`) in `api/config.php`. Log in again after changing it. |

## What's in the database
- **users**: firstname, email, password (hashed, not readable)
- **memberships**: contents of the join form of each member who joined
- **announcements**: announcements and the path of the picture (pictures are stored in `uploads/announcements/`)

The clubs themselves (name, logo, member pictures, activities) are still in `clubs.js`.

## Security note
This is fine for a school project and local use. Before putting it on the real internet:
use HTTPS, change the MySQL `root` password, and create a separate MySQL user for the website.
