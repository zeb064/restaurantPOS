"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  TextInput,
  Button,
  Stack,
  Text,
  Avatar,
  Group,
  Divider,
  PasswordInput,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { useAuth } from "@/lib/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils/format";
import { getPlanName, getPlanColor } from "@/lib/utils/plan-utils";
import { Badge } from "@mantine/core";
import { IconCheck, IconAlertCircle } from "@tabler/icons-react";

export default function PerfilPage() {
  const { userId, nombre: userName, rol, plan } = useAuth();
  const supabase = createClient();

  const [nombre, setNombre] = useState(userName ?? "");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      supabase
        .from("perfiles")
        .select("*")
        .eq("usuario_id", userId)
        .single()
        .then(({ data }) => {
          if (data) {
            setNombre(data.nombre);
            setTelefono(data.telefono ?? "");
          }
        });

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) setEmail(user.email);
      });
    }
  }, [userId]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ nombre, telefono })
      .eq("usuario_id", userId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPasswordLoading(true);
    const { error: pwError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (pwError) {
      setPasswordError(pwError.message);
      setPasswordLoading(false);
      return;
    }

    setPasswordSaved(true);
    setPasswordLoading(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  if (!userId) {
    return (
      <Center h="50vh">
        <Loader />
      </Center>
    );
  }

  return (
    <Container fluid p="lg" maw={720}>
      <Title order={3} mb="lg">
        Mi Perfil
      </Title>

      <Group mb="xl">
        <Avatar color="blue" size="xl" radius="xl">
          {getInitials(nombre)}
        </Avatar>
        <div>
          <Text size="lg" fw={600}>
            {nombre}
          </Text>
          <Text size="sm" c="dimmed">
            {email}
          </Text>
          <Group gap="xs" mt={4}>
            <Badge size="sm" variant="light">
              {rol}
            </Badge>
            <Badge size="sm" variant="light" color={getPlanColor(plan)}>
              Plan {getPlanName(plan)}
            </Badge>
          </Group>
        </div>
      </Group>

      <Paper withBorder p="lg" radius="md" mb="lg">
        <Title order={4} mb="md">
          Información Personal
        </Title>
        <form onSubmit={handleSaveProfile}>
          <Stack>
            {error && (
              <Alert
                variant="light"
                color="red"
                title="Error"
                icon={<IconAlertCircle size={16} />}
              >
                {error}
              </Alert>
            )}
            {saved && (
              <Alert
                variant="light"
                color="green"
                title="Guardado"
                icon={<IconCheck size={16} />}
              >
                Perfil actualizado correctamente.
              </Alert>
            )}

            <TextInput
              label="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Correo electrónico"
              value={email}
              disabled
              description="El correo no se puede cambiar desde aquí."
            />
            <TextInput
              label="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.currentTarget.value)}
              placeholder="+57 300 123 4567"
            />

            <Button type="submit" loading={loading} fullWidth maw={200}>
              Guardar Cambios
            </Button>
          </Stack>
        </form>
      </Paper>

      <Paper withBorder p="lg" radius="md">
        <Title order={4} mb="md">
          Cambiar Contraseña
        </Title>
        <form onSubmit={handleChangePassword}>
          <Stack>
            {passwordError && (
              <Alert
                variant="light"
                color="red"
                title="Error"
                icon={<IconAlertCircle size={16} />}
              >
                {passwordError}
              </Alert>
            )}
            {passwordSaved && (
              <Alert
                variant="light"
                color="green"
                title="Contraseña actualizada"
                icon={<IconCheck size={16} />}
              >
                Tu contraseña ha sido cambiada exitosamente.
              </Alert>
            )}

            <PasswordInput
              label="Contraseña actual"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
              required
              description="Mínimo 6 caracteres"
            />
            <PasswordInput
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.currentTarget.value)}
              required
            />

            <Button
              type="submit"
              loading={passwordLoading}
              fullWidth
              maw={200}
            >
              Cambiar Contraseña
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
