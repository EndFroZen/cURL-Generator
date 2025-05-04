package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/template/html/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	engine := html.New("./views", ".html")


	app := fiber.New(fiber.Config{
		Views: engine,
	})
	app.Use(logger.New())
	app.Static("/css","./css")
	app.Static("/scr","./script")
	app.Get("/",func (c *fiber.Ctx)error  {
		return c.Render("poster",fiber.Map{
			"title":"welcomechanachol",
		})
	})

	log.Fatal(app.Listen(":3000"))
}
