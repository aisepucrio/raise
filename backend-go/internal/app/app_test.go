package app

import "testing"

func TestConfigValidateAdmin(t *testing.T) {
	for _, c := range []struct {
		username, password string
		ok                 bool
	}{
		{"", "", true},
		{"admin", "a-long-password", true},
		{"admin", "", false},
		{"", "a-long-password", false},
	} {
		err := Config{AdminUsername: c.username, AdminPassword: c.password}.validate()
		if (err == nil) != c.ok {
			t.Errorf("username %q, password %q: got %v, want ok=%v", c.username, c.password, err, c.ok)
		}
	}
}
