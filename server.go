package main

import (
	"fmt"
	"log"
	"os/exec"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/html/v2"
	"github.com/google/shlex"
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
		
		type Request struct {
			Command string `json:"command"`
		}

		var body Request
		if err := c.BodyParser(&body); err != nil {
			return c.Status(400).SendString("Invalid request")
		}

		// fmt.Println("Raw command:", body.Command)

		// 🔧 ลบ backslash ที่ใช้แบ่งบรรทัด
		clean := strings.ReplaceAll(body.Command, "\\", "")
		fmt.Println("Cleaned command:", clean)

		// 🔐 ใช้ shlex เพื่อ parse command อย่างปลอดภัย
		args, err := shlex.Split(clean)
		if err != nil {
			return c.Status(400).SendString("Failed to parse command")
		}

		if len(args) == 0 {
			return c.Status(400).SendString("Empty command")
		}

		// ✅ สร้างคำสั่งจาก args ที่ parse แล้ว
		cmd := exec.Command(args[0], args[1:]...)

		// ⏳ รันคำสั่ง
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
