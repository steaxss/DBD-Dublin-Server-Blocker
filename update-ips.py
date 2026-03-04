import urllib.request
import json
import os

URL = "https://ip-ranges.amazonaws.com/ip-ranges.json"
REGION = "eu-west-1"
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "eu-west-1.txt")


def fetch_ip_ranges():
    print(f"Fetching IP ranges from {URL}...")
    with urllib.request.urlopen(URL) as response:
        data = json.loads(response.read().decode())
    print(f"Data date: {data.get('createDate', 'unknown')}")
    return data


def extract_ipv4_prefixes(data):
    prefixes = [
        entry["ip_prefix"]
        for entry in data.get("prefixes", [])
        if entry.get("region") == REGION and "ip_prefix" in entry
    ]
    return sorted(set(prefixes))


def write_output(prefixes):
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(prefixes) + "\n")
    print(f"Written {len(prefixes)} IPv4 prefixes to {OUTPUT_FILE}")


def main():
    data = fetch_ip_ranges()
    prefixes = extract_ipv4_prefixes(data)
    if not prefixes:
        print(f"No IPv4 prefixes found for region '{REGION}'. Aborting.")
        return
    write_output(prefixes)


if __name__ == "__main__":
    main()
