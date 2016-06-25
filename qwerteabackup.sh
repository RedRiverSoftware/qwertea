# MySQL password: QrEvQLxKUwVExpyk

sudo rm qwerteabackup.tar.gz
sudo mysqldump qwertea > qwertea.sql -p
sudo tar czf qwerteabackup.tar.gz /var/www --add-file /usr/bin/qwerteabot --add-file qwertea.sql
sudo rm qwertea.sql