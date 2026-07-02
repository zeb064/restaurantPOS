"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Stack,
  Stepper,
  Group,
  Alert,
  PasswordInput,
  Select,
} from "@mantine/core";
import { createClient } from "@/lib/supabase/client";
import { IconCheck, IconBuildingStore, IconUsers } from "@tabler/icons-react";

export default function SetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restaurante, setRestaurante] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    plan: "basico",
  });

  const [admin, setAdmin] = useState({
    nombre: "",
    email: "",
    password: "",
  });

  const handleCreateAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: admin.email,
          password: admin.password,
          options: {
            data: {
              nombre: admin.nombre,
            },
          },
        }
      );

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No se pudo crear el usuario");

      const { data: restData, error: restError } = await supabase
        .from("restaurantes")
        .insert({
          nombre: restaurante.nombre,
          direccion: restaurante.direccion || null,
          telefono: restaurante.telefono || null,
          plan: restaurante.plan,
        })
        .select()
        .single();

      if (restError) throw restError;

      const { error: perfilError } = await supabase.from("perfiles").insert({
        usuario_id: authData.user.id,
        restaurante_id: restData.id,
        nombre: admin.nombre,
        rol: "admin",
      });

      if (perfilError) throw perfilError;

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={560} my={40}>
      <Paper withBorder shadow="md" p="xl" radius="md">
        <Title ta="center" order={2} mb="xs">
          Configura tu Restaurante
        </Title>
        <Text c="dimmed" size="sm" ta="center" mb="xl">
          Completa los pasos para empezar a usar Restaurant POS
        </Text>

        <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
          <Stepper.Step
            label="Restaurante"
            description="Información del negocio"
            icon={<IconBuildingStore size={18} />}
          >
            <Stack mt="lg">
              <TextInput
                label="Nombre del restaurante"
                placeholder="Ej: Restaurante La Esquina"
                value={restaurante.nombre}
                onChange={(e) =>
                  setRestaurante({ ...restaurante, nombre: e.currentTarget.value })
                }
                required
              />
              <TextInput
                label="Dirección"
                placeholder="Calle Principal #123"
                value={restaurante.direccion}
                onChange={(e) =>
                  setRestaurante({
                    ...restaurante,
                    direccion: e.currentTarget.value,
                  })
                }
              />
              <TextInput
                label="Teléfono"
                placeholder="+57 300 123 4567"
                value={restaurante.telefono}
                onChange={(e) =>
                  setRestaurante({
                    ...restaurante,
                    telefono: e.currentTarget.value,
                  })
                }
              />
              <Select
                label="Plan"
                data={[
                  { value: "basico", label: "Básico - Ventas de Mostrador" },
                  { value: "medio", label: "Medio - Mesas y KDS" },
                  { value: "avanzado", label: "Avanzado - Inventario Completo" },
                ]}
                value={restaurante.plan}
                onChange={(value) =>
                  setRestaurante({ ...restaurante, plan: value ?? "basico" })
                }
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step
            label="Administrador"
            description="Crea tu cuenta"
            icon={<IconUsers size={18} />}
          >
            <Stack mt="lg">
              <TextInput
                label="Nombre completo"
                placeholder="Tu nombre"
                value={admin.nombre}
                onChange={(e) =>
                  setAdmin({ ...admin, nombre: e.currentTarget.value })
                }
                required
              />
              <TextInput
                label="Correo electrónico"
                placeholder="admin@restaurante.com"
                type="email"
                value={admin.email}
                onChange={(e) =>
                  setAdmin({ ...admin, email: e.currentTarget.value })
                }
                required
              />
              <PasswordInput
                label="Contraseña"
                placeholder="Mínimo 6 caracteres"
                value={admin.password}
                onChange={(e) =>
                  setAdmin({ ...admin, password: e.currentTarget.value })
                }
                required
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Completed>
            <Stack ta="center" mt="lg" align="center">
              <IconCheck size={48} color="green" />
              <Title order={4}>Todo listo para empezar</Title>
              <Text c="dimmed">
                Revisa la información antes de crear tu cuenta.
              </Text>

              <Paper withBorder p="md" w="100%" maw={400}>
                <Text size="sm" fw={500}>
                  {restaurante.nombre}
                </Text>
                <Text size="xs" c="dimmed">
                  {restaurante.direccion} | {restaurante.telefono}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Plan: {restaurante.plan} | Admin: {admin.nombre} ({admin.email})
                </Text>
              </Paper>

              {error && (
                <Alert variant="light" color="red" w="100%" maw={400}>
                  {error}
                </Alert>
              )}
            </Stack>
          </Stepper.Completed>
        </Stepper>

        <Group justify="space-between" mt="xl">
          <Button
            variant="default"
            onClick={() => setActive((a) => Math.max(0, a - 1))}
            disabled={active === 0}
          >
            Atrás
          </Button>

          {active < 2 ? (
            <Button
              onClick={() => setActive((a) => a + 1)}
              disabled={
                (active === 0 && !restaurante.nombre) ||
                (active === 1 && (!admin.nombre || !admin.email || !admin.password))
              }
            >
              Siguiente
            </Button>
          ) : (
            <Button onClick={handleCreateAccount} loading={loading}>
              Crear Cuenta
            </Button>
          )}
        </Group>
      </Paper>
    </Container>
  );
}
