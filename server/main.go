package main

import (
	"fmt"
	"log"

	"github.com/datmedevil17/clash/server/config"
	"github.com/datmedevil17/clash/server/routes"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()

	gin.SetMode(cfg.GinMode)

	r := gin.New()
	routes.Register(r)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 clash-server listening on %s (mode: %s)\n", addr, cfg.GinMode)

	if err := r.Run(addr); err != nil {
		log.Fatalf("server failed to start: %v", err)
	}
}
