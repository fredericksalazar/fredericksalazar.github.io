import os
import requests

domains = {
    "Globant": "globant.com",
    "Mercado Libre": "mercadolibre.com",
    "UBITS": "ubits.com",
    "DERCO COLOMBIA": "derco.com.co",
    "Arkano Software": "arkano.com.uy",
    "Olimpia IT": "olimpiait.com",
    "SuperGIROS": "supergiros.com.co",
    "Fasttrack SAS": "fasttrack.com.co",
    "Codesa": "codesa.com.co",
    "EPS SOS": "sos.com.co"
}

public_dir = "/Users/frederick/GitHub/fredericksalazar.github.io/public/logos"
os.makedirs(public_dir, exist_ok=True)

for name, domain in domains.items():
    filename = name.replace(" ", "_").lower() + ".png"
    filepath = os.path.join(public_dir, filename)
    
    # Try clearbit
    url = f"https://logo.clearbit.com/{domain}"
    print(f"Downloading {name} from {url}")
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(r.content)
            print(f"Success (Clearbit): {filename}")
            continue
    except Exception as e:
        print(f"Clearbit failed for {name}: {e}")

    # Fallback to Google Favicon
    url = f"https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://{domain}&size=256"
    print(f"Fallback downloading {name} from {url}")
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            with open(filepath, 'wb') as f:
                f.write(r.content)
            print(f"Success (Google Favicon): {filename}")
        else:
            print(f"Failed to download {name}")
    except Exception as e:
        print(f"Google Favicon failed for {name}: {e}")
