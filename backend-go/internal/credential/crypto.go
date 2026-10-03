// Package credential manages the lab-wide pool of platform API credentials:
// storing them encrypted, testing them through each platform's
// TestCredential, and leasing them to jobs with quota tracking.
package credential

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// Keyring holds the AES-256 keys used to encrypt credential secrets. New
// secrets are sealed with the highest version; older versions remain available
// for decryption, which allows key rotation without downtime.
//
// Format of the ENCRYPTION_KEYS variable: "1:<base64 32 bytes>,2:<base64>".
type Keyring struct {
	keys    map[int32]cipher.AEAD
	current int32
}

func ParseKeyring(s string) (*Keyring, error) {
	kr := &Keyring{keys: map[int32]cipher.AEAD{}}
	for part := range strings.SplitSeq(s, ",") {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		verStr, b64, ok := strings.Cut(part, ":")
		if !ok {
			return nil, errors.New(`encryption key must look like "<version>:<base64>"`)
		}
		ver, err := strconv.ParseInt(verStr, 10, 32)
		if err != nil || ver <= 0 {
			return nil, fmt.Errorf("invalid key version %q", verStr)
		}
		key, err := base64.StdEncoding.DecodeString(b64)
		if err != nil || len(key) != 32 {
			return nil, fmt.Errorf("key version %d must be 32 bytes, base64 encoded", ver)
		}
		block, err := aes.NewCipher(key)
		if err != nil {
			return nil, err
		}
		aead, err := cipher.NewGCM(block)
		if err != nil {
			return nil, err
		}
		kr.keys[int32(ver)] = aead
		kr.current = max(kr.current, int32(ver))
	}
	if len(kr.keys) == 0 {
		return nil, errors.New("no encryption keys configured")
	}
	return kr, nil
}

// GenerateKey returns a new key in the ENCRYPTION_KEYS format.
func GenerateKey(version int) (string, error) {
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return "", err
	}
	return fmt.Sprintf("%d:%s", version, base64.StdEncoding.EncodeToString(key)), nil
}

// Seal encrypts plaintext. aad binds the ciphertext to its context (platform
// and kind) so a secret can't be swapped between rows.
func (k *Keyring) Seal(plaintext, aad []byte) (version int32, nonce, ciphertext []byte, err error) {
	aead := k.keys[k.current]
	nonce = make([]byte, aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return 0, nil, nil, err
	}
	return k.current, nonce, aead.Seal(nil, nonce, plaintext, aad), nil
}

func (k *Keyring) Open(version int32, nonce, ciphertext, aad []byte) ([]byte, error) {
	aead, ok := k.keys[version]
	if !ok {
		return nil, fmt.Errorf("encryption key version %d not configured", version)
	}
	return aead.Open(nil, nonce, ciphertext, aad)
}
