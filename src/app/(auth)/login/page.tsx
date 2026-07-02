"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Anchor,
  Alert,
} from "@mantine/core";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2} mb="xs">
        Restaurant POS
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="lg">
        Ingresa tus credenciales para continuar
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            {error && (
              <Alert variant="light" color="red" title="Error">
                {error}
              </Alert>
            )}

            <TextInput
              label="Correo electrónico"
              placeholder="admin@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              type="email"
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />

            <Button type="submit" fullWidth loading={loading}>
              Iniciar Sesión
            </Button>
          </Stack>
        </form>

        <Anchor
          component="button"
          size="sm"
          ta="center"
          mt="md"
          onClick={() => router.push("/recuperar")}
        >
          ¿Olvidaste tu contraseña?
        </Anchor>
      </Paper>
    </Container>
  );
}
