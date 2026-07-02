"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TextInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Stack,
  Anchor,
  Alert,
} from "@mantine/core";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Title order={3} mb="sm">
            Revisa tu correo
          </Title>
          <Text c="dimmed" size="sm">
            Si la dirección existe, recibirás un enlace para restablecer tu
            contraseña.
          </Text>
          <Button
            fullWidth
            mt="lg"
            variant="light"
            onClick={() => router.push("/login")}
          >
            Volver al inicio de sesión
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2} mb="xs">
        Recuperar Contraseña
      </Title>
      <Text c="dimmed" size="sm" ta="center" mb="lg">
        Ingresa tu correo y te enviaremos un enlace
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

            <Button type="submit" fullWidth loading={loading}>
              Enviar enlace
            </Button>
          </Stack>
        </form>

        <Anchor
          component="button"
          size="sm"
          ta="center"
          mt="md"
          onClick={() => router.push("/login")}
        >
          Volver al inicio de sesión
        </Anchor>
      </Paper>
    </Container>
  );
}
