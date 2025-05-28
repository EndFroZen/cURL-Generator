package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/html/v2"
)

func main() {
	engine := html.New("./views", ".html")

	app := fiber.New(fiber.Config{
		Views: engine,
	})

	app.Use(logger.New())
	app.Static("/css", "./css")
	app.Static("/scr", "./script")
	app.Get("/", func(c *fiber.Ctx) error {
		return c.Render("poster", nil)
	})
	app.Post("/curlpost/:onos", func(c *fiber.Ctx) error {
		onos := c.Params("onos")
		fmt.Println(onos)
		type Request struct {
			Command string `json:"command"`
		}

		var body Request
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).SendString("Invalid request")
		}

		// ตรวจสอบว่าเป็นคำสั่ง curl เท่านั้น
		// if !strings.HasPrefix(body.Command, "curl ") {
		// 	return c.Status(400).SendString("Only curl commands are allowed")
		// }
		fmt.Println(body.Command)

		var cmd *exec.Cmd

		clean := strings.ReplaceAll(body.Command, "\\", "")
		clean = strings.ReplaceAll(clean, "'", "")

		// แปลงเป็น slice args
		args := strings.Fields(clean)

		// ใช้ exec.Command
		cmd = exec.Command(args[0], args[1:]...)

		out, err := cmd.CombinedOutput()
		if err != nil {
			return c.Status(500).JSON(fiber.Map{
				"error":   true,
				"message": err.Error(),
				"output":  string(out),
			})
		}

		return c.JSON(fiber.Map{
			"error":  false,
			"output": string(out),
		})
	})
	app.Get("/testapi", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"project": "ADDMS",
			"version": "1.0.0",
			"author": fiber.Map{
				"name": "นาย",
				"role": "Developer",
			},
			"features": []string{
				"เว็บไซต์หลายโดเมน",
				"ระบบจัดการไฟล์",
				"แผงควบคุมแบบกราฟิก",
				"การตั้งค่าพื้นฐานเซิร์ฟเวอร์",
			},
			"settings": fiber.Map{
				"theme":          "dark",
				"language":       "th",
				"storageLimitGB": 5,
			},
			"status": "active",
		})
	})

	log.Fatal(app.Listen("127.0.0.1:3000"))
}
