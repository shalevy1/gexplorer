FROM python:3.7-alpine

COPY . /src

WORKDIR /src

RUN pip install -r requirements.txt
RUN python setup.py install

ENTRYPOINT [ "gexplorer", "-p", "80", "start"]