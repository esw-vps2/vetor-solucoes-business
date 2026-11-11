from typing import Union

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

BACKOFF_FACTOR = 0.5
MAX_RETRIES = 6
ERROR_CODES = (500, 502, 503, 504)

class Session:
    def __init__(self):
        self.session = requests.Session()
        self.retry = Retry(
            total=MAX_RETRIES,
            read=MAX_RETRIES,
            connect=MAX_RETRIES,
            backoff_factor=BACKOFF_FACTOR,
            status_forcelist=ERROR_CODES
        )
        self.adapter = HTTPAdapter(max_retries=self.retry)
        self.session.mount('http://', self.adapter)
        self.session.mount('https://', self.adapter)
    def get(self) -> Union[requests.Session, None]:
        return self.session

class Api:
    def __init__(
        self,
        url: str,
        headers: dict = None,
        params: dict = None,
        data: Union[str, dict] = None,
        json: dict = None,
        files = None
    ) -> None:
        self.url = url
        self.headers = headers
        self.params = params
        self.data = data
        self.json = json
        self.files = files
        self.verify = True
        self.session = Session().get()
    def get(self) -> Union[requests.Response, None]:
        response = self.session.get(
            url=self.url,
            headers=self.headers,
            params=self.params,
            data=self.data,
            verify=self.verify
        )

        return response
    def post(self) -> Union[requests.Response, None]:
        response = self.session.post(
            url=self.url,
            headers=self.headers,
            params=self.params,
            data=self.data,
            json=self.json,
            files=self.files,
            verify=self.verify
        )
        return response
    def delete(self) -> Union[requests.Response, None]:
        response = self.session.delete(
            url=self.url,
            headers=self.headers,
            params=self.params,
            data=self.data,
            json=self.json,
            verify=self.verify
        )
        return response
    def put(self) -> Union[requests.Response, None]:
        response = self.session.put(
            url=self.url,
            headers=self.headers,
            params=self.params,
            data=self.data,
            json=self.json,
            verify=self.verify
        )
        return response
    def patch(self) -> Union[requests.Response, None]:
        response = self.session.patch(
            url=self.url,
            headers=self.headers,
            params=self.params,
            data=self.data,
            json=self.json,
            verify=self.verify
        )
        return response
