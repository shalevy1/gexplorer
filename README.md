## Introduction

Graph Explorer (GExplorer) is a web application for visualizing graphical data stored using the GDC provided open source framework ([psqlgraph](https://github.com/NCI-GDC/psqlgraph)). The major goals of the project is to improve the speed at which one can understand the undelying structure of the graph and quickly detect problems in submitted data.

The project is currently in development phase

![Screenshot 1](docs/screenshots/gexplore_1.png)

## Dependencies
* Python 2.7+
* [psqlgraph](https://github.com/NCI-GDC/psqlgraph)

## How to install

* Create a py27 virtual environment
```bash

# activate venv
source venv/bin/activate 
# install dependencies
(venv) pip install -r requirements.txt

# install script
(venv) python setup.py install
```
Set these env vars
* DB_HOST=XX.XX.X
* DB_USER=dev
* DB_PWD=dev
* DB_NAME=dev

```bash
# start service
(venv) gexplorer start -p 8081

```
### License
GExplorer is licensed under Apache v2 License