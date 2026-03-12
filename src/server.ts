import app from "./app";
import { prisma } from "./config/database";

const PORT = process.env.PORT || 3333;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("Banco de dados conectado");

    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

bootstrap();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  console.log("Banco de dados desconectado");
  process.exit(0);
});
