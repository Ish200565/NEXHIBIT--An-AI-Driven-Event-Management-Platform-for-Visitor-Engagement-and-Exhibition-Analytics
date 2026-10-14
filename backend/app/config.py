from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@localhost:5432/nexhibit"
    dwell_threshold_s: float = 10.0
    dwell_grace_s: float = 3.0
    heatmap_rows: int = 9
    heatmap_cols: int = 16
    api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""

    @property
    def sqlalchemy_url(self) -> str:
        """Hosts like Render hand out postgres:// URLs; SQLAlchemy needs a driver name."""
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg2://", 1)
        if url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url


settings = Settings()
