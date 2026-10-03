// Command raisectl is the operations CLI: migrations, bootstrapping users and
// generating encryption keys.
//
//	raisectl migrate up|down|status
//	raisectl user create -username alice -role admin
//	raisectl user reset-password -username alice
//	raisectl keygen [-version N]
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"golang.org/x/term"

	"raise/internal/access"
	"raise/internal/auth"
	"raise/internal/credential"
	"raise/internal/db"
)

const usage = `usage:
  raisectl migrate up|down|status
  raisectl user create -username NAME [-role viewer|researcher|admin] [-password-stdin]
  raisectl user reset-password -username NAME [-password-stdin]
  raisectl keygen [-version N]`

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, "raisectl:", err)
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string) error {
	if len(args) == 0 {
		return errors.New(usage)
	}
	switch args[0] {
	case "keygen":
		fs := flag.NewFlagSet("keygen", flag.ExitOnError)
		version := fs.Int("version", 1, "key version (increment when rotating)")
		_ = fs.Parse(args[1:])
		key, err := credential.GenerateKey(*version)
		if err != nil {
			return err
		}
		fmt.Println(key)
		return nil
	case "migrate":
		if len(args) != 2 {
			return errors.New(usage)
		}
		pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
		if err != nil {
			return err
		}
		defer pool.Close()
		switch args[1] {
		case "up":
			return db.MigrateUp(ctx, pool, os.Stdout)
		case "down":
			return db.MigrateDown(ctx, pool, os.Stdout)
		case "status":
			return db.MigrateStatus(ctx, pool, os.Stdout)
		}
		return errors.New(usage)
	case "user":
		return userCmd(ctx, args[1:])
	}
	return errors.New(usage)
}

func userCmd(ctx context.Context, args []string) error {
	if len(args) == 0 {
		return errors.New(usage)
	}
	fs := flag.NewFlagSet("user "+args[0], flag.ExitOnError)
	username := fs.String("username", "", "username")
	role := fs.String("role", string(access.Researcher), "role (create only)")
	fromStdin := fs.Bool("password-stdin", false, "read the password from stdin")
	_ = fs.Parse(args[1:])
	if *username == "" {
		return errors.New("-username is required")
	}

	pool, err := db.Connect(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer pool.Close()
	svc := auth.NewService(pool, nil)

	password, err := readPassword(*fromStdin)
	if err != nil {
		return err
	}

	switch args[0] {
	case "create":
		r, err := access.ParseRole(*role)
		if err != nil {
			return err
		}
		u, err := svc.CreateUser(ctx, *username, password, r)
		if err != nil {
			return err
		}
		fmt.Printf("created user %q (id %d, role %s)\n", u.Username, u.ID, u.Role)
	case "reset-password":
		u, err := svc.GetUserByUsername(ctx, *username)
		if err != nil {
			return err
		}
		if _, err := svc.UpdateUser(ctx, u.ID, auth.UserUpdate{Password: &password}); err != nil {
			return err
		}
		fmt.Printf("password reset for %q\n", u.Username)
	default:
		return errors.New(usage)
	}
	return nil
}

func readPassword(fromStdin bool) (string, error) {
	if fromStdin || !term.IsTerminal(int(os.Stdin.Fd())) {
		line, err := bufio.NewReader(os.Stdin).ReadString('\n')
		if err != nil && line == "" {
			return "", err
		}
		return strings.TrimRight(line, "\r\n"), nil
	}
	fmt.Fprint(os.Stderr, "Password: ")
	p1, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", err
	}
	fmt.Fprint(os.Stderr, "Repeat password: ")
	p2, err := term.ReadPassword(int(os.Stdin.Fd()))
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", err
	}
	if string(p1) != string(p2) {
		return "", errors.New("passwords don't match")
	}
	return string(p1), nil
}
