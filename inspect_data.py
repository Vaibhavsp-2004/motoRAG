import requests
from bs4 import BeautifulSoup

url = "https://www.bajajauto.com"

response = requests.get(url)

soup = BeautifulSoup(
    response.text,
    "html.parser"
)

search_text = "Pulsar N160"

if search_text.lower() in soup.get_text().lower():
    print(f"Found '{search_text}' on the page.")
else:
    print(f"'{search_text}' was NOT found on the page.")