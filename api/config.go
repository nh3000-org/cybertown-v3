package cybertown

type Config struct {
	Port        int    `env:"PORT,required"`
	PostgresURL string `env:"POSTGRES_URL,required"`
}
