package credential

import "testing"

func TestKeyringRoundTripAndRotation(t *testing.T) {
	k1, _ := GenerateKey(1)
	k2, _ := GenerateKey(2)

	old, err := ParseKeyring(k1)
	if err != nil {
		t.Fatal(err)
	}
	ver, nonce, ct, err := old.Seal([]byte("secret"), []byte("github/pat"))
	if err != nil {
		t.Fatal(err)
	}

	rotated, err := ParseKeyring(k1 + "," + k2)
	if err != nil {
		t.Fatal(err)
	}
	if rotated.current != 2 {
		t.Fatalf("current = %d, want 2", rotated.current)
	}
	pt, err := rotated.Open(ver, nonce, ct, []byte("github/pat"))
	if err != nil || string(pt) != "secret" {
		t.Fatalf("open after rotation: %q, %v", pt, err)
	}
	if _, err := rotated.Open(ver, nonce, ct, []byte("jira/api_token")); err == nil {
		t.Fatal("expected failure with mismatched aad")
	}
}
