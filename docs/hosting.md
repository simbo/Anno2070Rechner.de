Hosting
===

The site is a folder of static files. Any web server works that does the
following. Server changes are made by the author.

Requirements
---

- [ ] The unpacked release (`anno2070rechner.zip`) is the document root.
- [ ] The images from the image ZIP are served under `/img/`. Upload them before
      or together with a release that needs them.
- [ ] `/population` serves `/population/index.html`; the same for every page and
      `/<page>/en`.
- [ ] Redirects as in [Routing](rebuild-plan.md#routing): `/` and `/en` with
      307, `/<page>/`, `/<page>/de` and the removed pages with 301. Query
      parameters survive, except on removed pages.
- [ ] Unknown addresses get `404.html`, or `404.en.html` for English addresses,
      with status 404. Folders are never listed.
- [ ] `www.` redirects to the domain without it, keeping path and query.
- [ ] `/assets/*` is cached for a year (`immutable`), everything else is
      revalidated (`no-cache`).
- [ ] HTTPS, compression, `image/avif` and `image/webp` types.
- [ ] After a deployment, `https://anno2070rechner.de/version.txt` shows the
      release version.

Apache with .htaccess (Uberspace)
---

Tested on 2026-11-10 on Uberspace 7 in a temporary folder for
`simbo.uber.space`.

1. Move the old PHP folder aside on the server (it is in the export):
   `mv /var/www/virtual/simbo/anno2070rechner.de{,.php-old}` and create the
   folder again.
2. Upload the release and the images:

   ```bash
   unzip anno2070rechner.zip -d release
   rsync -a --delete --exclude /img/ --exclude /.htaccess release/ simbo:/var/www/virtual/simbo/anno2070rechner.de/
   rsync -a img/ simbo:/var/www/virtual/simbo/anno2070rechner.de/img/
   ```

3. Put this `.htaccess` into the folder:

   ```apache
   Options -Indexes -MultiViews
   DirectorySlash Off
   DirectoryIndex index.html
   AddDefaultCharset utf-8
   AddType image/avif avif
   AddType image/webp webp

   ErrorDocument 404 /404.html
   <If "%{REQUEST_URI} =~ m#(^|/)en(/|$)#">
     ErrorDocument 404 /404.en.html
   </If>

   RewriteEngine On
   RewriteBase /

   # HTTPS. Uberspace ends TLS in front of Apache and sets HTTPS in the environment.
   RewriteCond %{HTTPS} !=on
   RewriteCond %{ENV:HTTPS} !=on
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

   RewriteCond %{HTTP_HOST} ^www\.(.+)$ [NC]
   RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

   RewriteRule (^|/)\. - [R=404,L]

   RewriteRule ^$ /population [R=307,L]
   RewriteRule ^en/?$ /population/en [R=307,L]

   RewriteRule ^(login|register|logout|account|saved-data|password-lost|resend-activation|change-email|rda-import)/en/?$ /population/en [R=301,L,QSD]
   RewriteRule ^(login|register|logout|account|saved-data|password-lost|resend-activation|change-email|rda-import)(/de)?/?$ /population [R=301,L,QSD]

   RewriteRule ^(population|commoditychains|database|info)/de/?$ /$1 [R=301,L]
   RewriteRule ^(population|commoditychains|database|info)(/en)?/$ /$1$2 [R=301,L]

   RewriteCond %{REQUEST_FILENAME} -d
   RewriteCond %{REQUEST_FILENAME}/index.html -f
   RewriteRule ^(.+)$ $1/index.html [L]
   RewriteCond %{REQUEST_FILENAME} -d
   RewriteRule ^ - [R=404,L]

   <IfModule mod_headers.c>
     Header set Cache-Control "no-cache"
     <If "%{REQUEST_URI} =~ m#^/assets/#">
       Header set Cache-Control "public, max-age=31536000, immutable"
     </If>
   </IfModule>
   ```

4. Fix the `www.` redirect. `www.anno2070rechner.de` is a link to
   `redirect-to/anno2070rechner.de`, whose `.htaccess` drops the path. Replace
   it with:

   ```apache
   RewriteEngine On
   RewriteRule ^ https://anno2070rechner.de%{REQUEST_URI} [R=301,L]
   ```

5. Check: `curl -s https://anno2070rechner.de/version.txt`, then run
   `scripts/uberspace-cleanup.sh` to remove the old database.

Caddy (SRVKIST, later)
---

Not tested yet. The release goes to `releases/<version>/` with `current` as a
link to the active one, the images to `shared/img/`.

```caddy
anno2070rechner.de {
	root * /var/www/anno2070rechner.de/current
	encode zstd gzip

	redir / /population 307
	redir /en /population/en 307

	@removedEn path_regexp ^/(login|register|logout|account|saved-data|password-lost|resend-activation|change-email|rda-import)/en/?$
	redir @removedEn /population/en 301
	@removed path_regexp ^/(login|register|logout|account|saved-data|password-lost|resend-activation|change-email|rda-import)(/de)?/?$
	redir @removed /population 301

	@german path_regexp german ^/(population|commoditychains|database|info)/de/?$
	redir @german /{re.german.1}{?query} 301
	@slash path_regexp slash ^/(population|commoditychains|database|info)(/en)?/$
	redir @slash /{re.slash.1}{re.slash.2}{?query} 301

	@assets path /assets/*
	header @assets Cache-Control "public, max-age=31536000, immutable"
	@other not path /assets/*
	header @other Cache-Control "no-cache"

	handle_path /img/* {
		root * /var/www/anno2070rechner.de/shared/img
		file_server
	}

	handle {
		try_files {path} {path}/index.html
		file_server {
			hide .*
			disable_canonical_uris
		}
	}

	handle_errors 404 {
		@english path_regexp (^|/)en(/|$)
		rewrite @english /404.en.html
		rewrite * /404.html
		file_server
	}
}

www.anno2070rechner.de {
	redir https://anno2070rechner.de{uri} 301
}
```
