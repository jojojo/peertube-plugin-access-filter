# peertube-plugin-access-filter

A PeerTube plugin that restricts access to video streams based on client IP and/or HTTP referrer.

Typical use case: only allow video playback
- from specific internal IPs (VPN, intranet, etc.)
- and/or when the player is embedded from a trusted domain (e.g. https://www.airmes-application.eu).

## Features

- Configure allowed IPs (comma-separated) in the admin UI
- Configure allowed referrer domains (comma-separated)
- Blocks direct access to video URLs (.m3u8, .ts, .mp4, ...)
- Logs blocked accesses in PeerTube logs

## Installation

Once published on npm:

1. In PeerTube, go to **Administration → Plugins / Themes**
2. Search for `peertube-plugin-access-filter`
3. Install the plugin
4. Enable it

## Configuration

In the plugin settings:

- **Authorized IPs (comma-separated)**  
  Example: `10.0.0.1, 192.168.0., 172.16.`

- **Authorized referrer domains (comma-separated)**  
  Example: `https://www.airmes-application.eu, https://app.airmes-application.eu`

If no IPs and no referrers are set, the plugin lets all traffic pass (fail-open).

## License

MIT