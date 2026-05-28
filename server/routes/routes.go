package routes

import (
	"github.com/datmedevil17/clash/server/handlers"
	"github.com/datmedevil17/clash/server/middleware"
	"github.com/gin-gonic/gin"
)

// Register wires all routes onto the engine.
func Register(r *gin.Engine) {
	r.Use(middleware.CORS())
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())

	// Health
	r.GET("/health", handlers.HealthCheck)

	// API v1
	v1 := r.Group("/api/v1")
	{
		_ = v1 // add route groups here, e.g. v1.GET("/users", handlers.GetUsers)
	}
}
