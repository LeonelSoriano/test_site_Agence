# test_site_Agence

#Dump de base de datos:

Si usas mysql superior a 5.7+, debes configurar tu my.cnf de tal modo que quede de esta forma

```
[mysqld]
sql_mode=NO_ENGINE_SUBSTITUTION
``` 
esto se debe a que apartir de mysql 5.7 la fechas de tipo defaul '0000-00-00 00:00:00' son consideradas con invalidas.