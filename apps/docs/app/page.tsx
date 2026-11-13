import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Code2,
  Download,
  Layers3,
  RotateCcw,
} from "lucide-react";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Section,
  Separator,
  Text,
} from "@radix-ui/themes";
import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import { SavePlayground } from "@/components/SavePlayground";

const example = `import { SaveIndicator, useSaveState } from '@checkpoint-dev/savestate';
import '@checkpoint-dev/savestate/styles.css';

function Editor() {
  const save = useSaveState({
    initialValue: '',
    debounce: 700,
    onSave: saveDocument,
  });

  return (
    <>
      <textarea
        value={save.value}
        onChange={(event) => save.setValue(event.target.value)}
      />
      <SaveIndicator state={save.status} />
    </>
  );
}`;

const components = [
  {
    title: "SaveIndicator",
    description: "A clear inline answer to “did that save?”",
    icon: Check,
  },
  {
    title: "SaveButton",
    description: "An explicit save action with pending and retry states.",
    icon: Download,
  },
  {
    title: "SaveProgress",
    description: "Progress feedback for larger saves and uploads.",
    icon: RotateCcw,
  },
  {
    title: "SaveStatus",
    description: "Detailed state with context and an optional retry action.",
    icon: Layers3,
  },
];

export default function HomePage() {
  return (
    <main>
      <Container size="4" px={{ initial: "4", md: "6" }}>
        <Section size="3" className="home-hero">
          <Grid
            columns={{ initial: "1", md: "2" }}
            gap={{ initial: "7", md: "9" }}
            align="center"
          >
            <Flex direction="column" gap="5" className="home-hero__copy">
              <Heading
                as="h1"
                size="9"
                weight="bold"
                className="home-hero__title"
              >
                Make every save feel certain.
              </Heading>
              <Text as="p" size="5" color="gray" className="home-hero__lead">
                A focused component kit for unsaved changes, saving, saved,
                offline, and errors, so people always know what happened to
                their work.
              </Text>
              <Flex gap="3" wrap="wrap">
                <Button asChild size="4">
                  <Link href="/docs">
                    Get started <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild size="4" variant="outline">
                  <Link href="/docs/components">Browse the components</Link>
                </Button>
              </Flex>
              <Text size="3" color="gray">
                Your persistence stays yours. Save State makes the lifecycle
                visible.
              </Text>
            </Flex>

            <Box className="home-hero__demo">
              <SavePlayground />
              <Box className="home-install">
            <CodeBlock
              className="home-install__code"
              title="Install with npm"
              viewportProps={{ className: "home-install__viewport" }}
            >
              <Pre>
                <code>npm install @checkpoint-dev/savestate</code>
              </Pre>
            </CodeBlock>
          </Box>
            </Box>
          </Grid>
        </Section>

        <Section size="3" className="home-section">
          <Flex direction="column" gap="2" mb="6">
            <Heading as="h2" size="7">
              Purpose-built for saving.
            </Heading>
            <Text as="p" size="4" color="gray" className="home-section__intro">
              These are not generic alerts. Each component represents a real
              stage of user work.
            </Text>
          </Flex>
          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4">
            {components.map(({ title, description, icon: Icon }) => (
              <Card size="3" variant="surface" key={title}>
                <Flex direction="column" gap="4">
                  <Icon size={22} aria-hidden="true" />
                  <Heading as="h3" size="4">
                    {title}
                  </Heading>
                  <Text as="p" size="3" color="gray">
                    {description}
                  </Text>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Section>

        <Section size="3" className="home-section">
          <Grid className="home-grid" gap="7" align="center">
            <Flex direction="column" gap="4">
              <Heading as="h2" size="7">
                A small API. A complete answer.
              </Heading>
              <Text
                as="p"
                size="4"
                color="gray"
                className="home-section__intro"
              >
                Connect your save function, edit a value, and show the result.
                The library handles debouncing and state feedback without taking
                over your data layer.
              </Text>
              <Flex direction="column" gap="3">
                <Flex gap="3" align="start">
                  <Check className="home-check" size={19} />
                  <Text size="3">
                    The latest edits stay dirty until confirmed by your save
                    callback.
                  </Text>
                </Flex>
                <Flex gap="3" align="start">
                  <Check className="home-check" size={19} />
                  <Text size="3">
                    Errors and retries are part of the component states.
                  </Text>
                </Flex>
                <Flex gap="3" align="start">
                  <Check className="home-check" size={19} />
                  <Text size="3">
                    Local recovery is optional and never presented as remote
                    success.
                  </Text>
                </Flex>
              </Flex>
            </Flex>

            <Box className="home-code">
              <Flex align="center" justify="between" mb="3">
                <Text size="2" color="gray">
                  editor.tsx
                </Text>
                <Badge variant="soft" color="gray">
                  TypeScript
                </Badge>
              </Flex>
              <pre>
                <code>{example}</code>
              </pre>
            </Box>
          </Grid>
        </Section>

        <Section size="3" className="home-section home-last-section">
          <Flex direction="column" align="center" gap="4" py="6">
            <BookOpen size={28} aria-hidden="true" />
            <Heading as="h2" size="7" align="center">
              Good feedback is part of the feature.
            </Heading>
            <Text
              as="p"
              size="4"
              color="gray"
              align="center"
              className="home-section__closing"
            >
              Browse real examples, understand the save lifecycle, and choose
              the component that fits your interface.
            </Text>
            <Button asChild size="4">
              <Link href="/docs">
                Explore the documentation <ArrowRight size={18} />
              </Link>
            </Button>
          </Flex>
        </Section>
      </Container>

      <Separator size="4" />
      <Container size="4" px={{ initial: "4", md: "6" }}>
        <Flex justify="between" align="center" py="5" wrap="wrap" gap="3">
          <Text size="3" weight="medium">
            Save State
          </Text>
          <Text size="2" color="gray">
            Save-state components for interfaces that respect people’s work.
          </Text>
          <Button asChild size="3" variant="ghost">
            <Link href="/docs">
              Documentation <ArrowRight size={15} />
            </Link>
          </Button>
        </Flex>
      </Container>
    </main>
  );
}
