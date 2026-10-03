// Command worker runs River workers for mining jobs.
package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"raise/internal/app"
)

func main() {
	queues := flag.String("queues", "", "comma-separated queues to work (default: all)")
	flag.Parse()

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	var opts app.WorkerOptions
	if *queues != "" {
		opts.Queues = strings.Split(*queues, ",")
	}

	cfg, err := app.LoadConfig()
	if err == nil {
		err = app.RunWorker(ctx, cfg, opts)
	}
	if err != nil {
		fmt.Fprintln(os.Stderr, "worker:", err)
		os.Exit(1)
	}
}
