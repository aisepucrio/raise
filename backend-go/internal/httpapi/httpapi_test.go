package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestClientIP(t *testing.T) {
	trusted, err := ParseTrustedProxies([]string{"10.0.0.1", "172.16.0.0/12"})
	if err != nil {
		t.Fatal(err)
	}
	for _, c := range []struct {
		name, remote string
		xff          []string
		want         string
	}{
		{"direct, no header", "203.0.113.7:1234", nil, "203.0.113.7"},
		{"direct client can't spoof", "203.0.113.7:1234", []string{"1.2.3.4"}, "203.0.113.7"},
		{"behind proxy", "10.0.0.1:80", []string{"198.51.100.2"}, "198.51.100.2"},
		{"spoofed entries before the proxy's are ignored", "10.0.0.1:80", []string{"1.2.3.4, 198.51.100.2"}, "198.51.100.2"},
		{"chained proxies are skipped", "10.0.0.1:80", []string{"198.51.100.2, 172.20.0.5"}, "198.51.100.2"},
		{"repeated headers are one list", "10.0.0.1:80", []string{"1.2.3.4", "198.51.100.2"}, "198.51.100.2"},
		{"garbage keeps the last vouched address", "10.0.0.1:80", []string{"nonsense, 172.20.0.5"}, "172.20.0.5"},
		{"proxy without header", "10.0.0.1:80", nil, "10.0.0.1"},
		{"IPv4-mapped proxy address", "[::ffff:10.0.0.1]:80", []string{"198.51.100.2"}, "198.51.100.2"},
	} {
		t.Run(c.name, func(t *testing.T) {
			var got string
			h := clientIP(trusted)(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
				got = ClientIP(r.Context())
			}))
			r := httptest.NewRequest(http.MethodGet, "/", nil)
			r.RemoteAddr = c.remote
			for _, v := range c.xff {
				r.Header.Add("X-Forwarded-For", v)
			}
			h.ServeHTTP(httptest.NewRecorder(), r)
			if got != c.want {
				t.Errorf("got %q, want %q", got, c.want)
			}
		})
	}
	if _, err := ParseTrustedProxies([]string{"not-an-ip"}); err == nil {
		t.Error("an invalid trusted proxy was accepted")
	}
}
