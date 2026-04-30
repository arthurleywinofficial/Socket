import json

DASHBOARD_PATH = "/home/arthur/Proje/grafana/provisioning/dashboards/home.json"

with open(DASHBOARD_PATH, "r") as f:
    dashboard = json.load(f)

for panel in dashboard.get("panels", []):
    # 1. Her panelin arka planını şeffaf yap (Premium görünümlü modern tasarım için kilit özellik)
    panel["transparent"] = True
    
    # 2. Eğer "stat" paneliyse rengi sadece değer yerine arka planla birleştir, daha canlı dursun
    if panel.get("type") == "stat":
        if "options" in panel:
            # "colorMode"u "background" yaparak o renge tamamen bürünmesini sağlayabiliriz
            # Fakat çok parlak olabilir, o yüzden en iyisi Grafana UI standartlarında bırakmak. 
            # Sadece grafiği tam oturtalım (graphMode: area)
            panel["options"]["graphMode"] = "area"
            
    # 3. Time Series grafikleri için ızgaraları(grid) kapat ki karmaşık durmasın
    if panel.get("type") == "timeseries" and "fieldConfig" in panel and "defaults" in panel["fieldConfig"]:
        custom = panel["fieldConfig"]["defaults"].get("custom", {})
        if "drawStyle" not in custom:
            custom["drawStyle"] = "line"
        custom["fillOpacity"] = 10
        # Çizgi kalınlığını artıralım Thematic görünmesi için
        custom["lineWidth"] = 2
        # Alan altını dolduralım
        panel["fieldConfig"]["defaults"]["custom"] = custom

    # 4. Yükseklik standardizasyonu (Çok dar panelleri biraz büyüt)
    if "gridPos" in panel and panel["gridPos"].get("h", 0) < 5 and panel.get("type") != "row":
        panel["gridPos"]["h"] = 6
        
    # Tablo panelinin yüksekliğini maksimize et
    if panel.get("type") == "table" and "gridPos" in panel:
        panel["gridPos"]["h"] = 12

# Dashboard Sürümünü zorla artır (Değişikliklerin Grafana tarafından algılanması için)
dashboard["version"] = dashboard.get("version", 0) + 1

with open(DASHBOARD_PATH, "w") as f:
    json.dump(dashboard, f, indent=2)

print("Dashboard beautified and saved!")
