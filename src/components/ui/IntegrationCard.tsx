import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useReducedMotion } from '@/lib/hooks/useAccessibility';
import { LiquidGlassView } from './LiquidGlassView';

// Geometria do SVG original (21st.dev IntegrationCard).
const VIEWBOX_WIDTH = 564;
const VIEWBOX_HEIGHT = 410;
const HUB = { x: 282, y: 205 };
const NODE_SIZE = 48;
const HUB_SIZE = 56;

// Feixe: strokeDasharray "40 160", offset 200 → -200, 4s linear, infinito.
const BEAM_DASH = 40;
const BEAM_GAP = 160;
const BEAM_FROM = 200;
const BEAM_TO = -200;
const BEAM_DURATION = 4000;

type LogoProps = { color: string };

interface IntegrationItem {
  id: string;
  label: string;
  Logo: React.ComponentType<LogoProps>;
  x: number;
  y: number;
  path: string;
  delay: number; // segundos
}

const FigmaLogo = ({ color }: LogoProps) => (
  <Svg viewBox="0 0 19 28" width={19} height={28}>
    <Path
      fill={color}
      d="M9.19782 13.7949C9.19782 7.6656 18.3948 7.6656 18.3948 13.7949C18.3948 19.9242 9.19782 19.9242 9.19782 13.7949ZM0.000862536 22.9918C0.000522523 22.3879 0.119222 21.7899 0.350175 21.2318C0.581128 20.6738 0.919805 20.1668 1.34684 19.7398C1.77388 19.3127 2.2809 18.9741 2.83891 18.7431C3.39692 18.5122 3.99499 18.3935 4.59891 18.3938H9.19695V22.9918C9.19695 29.1211 0 29.1211 0 22.9918H0.000862536ZM9.19782 -0.000113647V9.19684H13.7959C19.9252 9.19684 19.9252 -0.000113647 13.7959 -0.000113647H9.19782ZM0.000862536 4.59793C0.000522523 5.20185 0.119222 5.79992 0.350175 6.35793C0.581128 6.91594 0.919805 7.42296 1.34684 7.85C1.77388 8.27704 2.2809 8.61571 2.83891 8.84667C3.39692 9.07762 3.99499 9.19632 4.59891 9.19598H9.19695V-0.000975834H4.59891C3.99499 -0.00131585 3.39692 0.117384 2.83891 0.348337C2.2809 0.57929 1.77388 0.917967 1.34684 1.345C0.919805 1.77204 0.581128 2.27906 0.350175 2.83707C0.119222 3.39509 0.000522523 3.99315 0.000862536 4.59707V4.59793ZM0.000862536 13.7949C0.000522523 14.3988 0.119222 14.9969 0.350175 15.5549C0.581128 16.1129 0.919805 16.6199 1.34684 17.047C1.77388 17.474 2.2809 17.8127 2.83891 18.0436C3.39692 18.2746 3.99499 18.3941 4.59891 18.3938H9.19695V9.19598H4.59891C3.99499 9.19564 3.39692 9.31434 2.83891 9.54529C2.2809 9.77624 1.77388 10.1149 1.34684 10.542C0.919805 10.969 0.581128 11.476 0.350175 12.034C0.119222 12.592 0.000522523 13.1901 0.000862536 13.794V13.7949Z"
    />
  </Svg>
);

const ClaudeLogo = ({ color }: LogoProps) => (
  <Svg viewBox="0 0 28 28" width={28} height={28}>
    <Path
      fill={color}
      d="M5.488 18.62L11.004 15.54L11.088 15.26L11.004 15.12H10.724L9.8 15.064L6.664 14.98L3.92 14.84L1.26 14.7L0.588 14.56L0 13.72L0.056 13.3L0.616 12.936L1.428 12.992L3.192 13.132L5.852 13.3L7.784 13.412L10.64 13.748H11.088L11.144 13.552L11.004 13.44L10.892 13.328L8.12 11.48L5.152 9.52L3.584 8.372L2.744 7.812L2.324 7.252L2.156 6.076L2.912 5.236L3.948 5.32L4.2 5.376L5.236 6.188L7.476 7.896L10.36 10.08L10.78 10.416L10.948 10.304L10.976 10.22L10.78 9.912L9.24 7L7.56 4.088L6.804 2.884L6.608 2.156C6.524 1.876 6.496 1.596 6.496 1.316L7.336 0.14L7.84 0L9.016 0.168L9.464 0.56L10.192 2.24L11.34 4.844L13.16 8.372L13.72 9.436L14 10.388L14.084 10.668H14.28V10.528L14.42 8.512L14.7 6.076L14.98 2.94L15.064 2.044L15.512 0.98L16.352 0.42L17.08 0.728L17.64 1.54L17.556 2.044L17.248 4.2L16.52 7.588L16.1 9.884H16.352L16.632 9.576L17.78 8.064L19.712 5.656L20.552 4.676L21.56 3.64L22.204 3.136H23.408L24.276 4.452L23.884 5.824L22.652 7.392L21.616 8.708L20.132 10.696L19.236 12.292L19.32 12.404H19.516L22.876 11.676L24.668 11.368L26.796 11.004L27.776 11.452L27.888 11.9L27.496 12.852L25.2 13.412L22.512 13.972L18.508 14.896L18.452 14.924L18.508 15.008L20.3 15.176L21.084 15.232H22.988L26.516 15.512L27.44 16.072L27.972 16.828L27.888 17.388L26.46 18.116L24.556 17.668L20.076 16.604L18.564 16.24H18.34V16.352L19.628 17.612L21.952 19.712L24.92 22.428L25.06 23.1L24.696 23.66L24.304 23.604L21.728 21.644L20.72 20.804L18.48 18.9H18.34V19.096L18.844 19.852L21.588 23.968L21.728 25.228L21.532 25.62L20.804 25.9L20.048 25.732L18.424 23.492L16.744 20.972L15.428 18.676L15.288 18.788L14.476 27.244L14.112 27.664L13.272 28L12.572 27.44L12.18 26.6L12.572 24.864L13.02 22.624L13.384 20.832L13.72 18.62L13.916 17.892V17.836H13.72L12.04 20.16L9.52 23.604L7.504 25.732L7.028 25.928L6.188 25.508L6.272 24.724L6.72 24.08L9.52 20.496L11.2 18.284L12.32 16.996L12.292 16.856H12.208L4.816 21.672L3.5 21.84L2.94 21.28L2.996 20.44L3.276 20.16L5.516 18.62H5.488Z"
    />
  </Svg>
);

const ReactLogo = ({ color }: LogoProps) => (
  <Svg viewBox="0 0 28 28" width={28} height={28}>
    <Path
      fill={color}
      d="M25.3376 13.9997C25.3376 12.3326 23.7754 10.8719 21.2927 9.9164C21.3266 9.7064 21.3826 9.48473 21.4094 9.28056C21.6626 6.87956 21.0909 5.14706 19.8006 4.40156C18.3597 3.56856 16.3204 4.18456 14.2577 5.84706C12.1916 4.1869 10.1499 3.5709 8.71257 4.40156C7.42107 5.14706 6.8459 6.87956 7.10373 9.28056C7.12473 9.48473 7.1819 9.7064 7.21457 9.9164C4.73307 10.8719 3.1709 12.3326 3.1709 13.9997C3.1709 15.6669 4.73307 17.1276 7.21457 18.0831C7.1819 18.2931 7.12473 18.5147 7.10373 18.7189C6.8494 21.1199 7.42107 22.8524 8.71257 23.5979C9.15123 23.8464 9.6494 23.9736 10.1534 23.9666C11.6826 23.826 13.1231 23.1865 14.2531 22.1466C15.3833 23.1867 16.8243 23.8263 18.3539 23.9666C18.8588 23.9737 19.3564 23.8465 19.7959 23.5979C21.0862 22.8524 21.6626 21.1199 21.4047 18.7189C21.3826 18.5147 21.3266 18.2931 21.2881 18.0831C23.7754 17.1276 25.3376 15.6669 25.3376 13.9997Z"
    />
  </Svg>
);

const MotionLogo = ({ color }: LogoProps) => (
  <Svg viewBox="0 0 28 28" width={28} height={28}>
    <Path
      fill={color}
      d="M10.5829 8.74902L5.04503 19.2503H0L4.32469 11.0509C4.99494 9.77912 6.66706 8.74902 8.0605 8.74902H10.5829ZM22.955 11.3747C22.955 9.92415 24.0842 8.74924 25.4774 8.74924C26.8706 8.74924 28 9.92393 28 11.3747C28 12.8248 26.8708 13.9997 25.4774 13.9997C24.0842 13.9997 22.955 12.8252 22.955 11.3747ZM11.5288 8.74902H16.5738L11.0359 19.2503H5.99091L11.5288 8.74902ZM17.4871 8.74902H22.5321L18.209 16.9484C17.5385 18.2202 15.8651 19.2503 14.4718 19.2503H11.9492L17.4871 8.74902Z"
    />
  </Svg>
);

const integrations: IntegrationItem[] = [
  { id: 'figma', label: 'Figma', Logo: FigmaLogo, x: 110, y: 90, path: 'M 270 205 V 105 Q 270 90 255 90 H 110', delay: 0.1 },
  { id: 'claude', label: 'Claude', Logo: ClaudeLogo, x: 360, y: 70, path: 'M 294 205 V 85 Q 294 70 309 70 H 360', delay: 0.2 },
  { id: 'react', label: 'React', Logo: ReactLogo, x: 480, y: 205, path: 'M 314 205 H 480', delay: 0.4 },
  { id: 'motion', label: 'Motion', Logo: MotionLogo, x: 282, y: 360, path: 'M 282 205 V 360', delay: 0.6 },
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface BeamProps {
  path: string;
  delay: number;
  color: string;
}

function Beam({ path, delay, color }: BeamProps) {
  const offset = useSharedValue(BEAM_FROM);

  useEffect(() => {
    offset.value = BEAM_FROM;
    offset.value = withDelay(
      delay * 1000,
      withRepeat(
        withTiming(BEAM_TO, { duration: BEAM_DURATION, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [delay, offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <AnimatedPath
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray={`${BEAM_DASH} ${BEAM_GAP}`}
      animatedProps={animatedProps}
    />
  );
}

interface IntegrationCardProps {
  style?: StyleProp<ViewStyle>;
}

export function IntegrationCard({ style }: IntegrationCardProps) {
  const { colors, radii, spacing, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  // Telas de aba continuam montadas fora de foco: sem foco, os feixes são desmontados para poupar CPU/bateria.
  const focused = useIsFocused();
  const animateBeams = focused && !reducedMotion;

  return (
    <LiquidGlassView
      variant="card"
      borderRadius={radii.lg}
      style={style}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Ilustração de integrações conectadas ao nós."
    >
      <View style={{ padding: spacing[16] }} importantForAccessibility="no-hide-descendants">
        <View style={styles.stage}>
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
            style={StyleSheet.absoluteFill}
          >
            {integrations.map((item) => (
              <Path
                key={`line-${item.id}`}
                d={item.path}
                fill="none"
                stroke={colors.textSecondary}
                strokeOpacity={0.25}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
            {animateBeams &&
              integrations.map((item) => (
                <Beam key={`beam-${item.id}`} path={item.path} delay={item.delay} color={colors.primary} />
              ))}
          </Svg>

          {integrations.map(({ id, Logo, x, y }) => (
            <LiquidGlassView
              key={id}
              variant="control"
              borderRadius={radii.pill}
              style={[styles.node, nodeBox(x, y, NODE_SIZE)]}
            >
              <View style={styles.center}>
                <Logo color={colors.textPrimary} />
              </View>
            </LiquidGlassView>
          ))}

          <LiquidGlassView
            variant="control"
            borderRadius={radii.pill}
            style={[styles.node, nodeBox(HUB.x, HUB.y, HUB_SIZE)]}
          >
            <View style={styles.center}>
              <Text
                style={[
                  typography.font.bold,
                  { color: colors.primaryText, fontSize: typography.fontSize.md },
                ]}
              >
                nós.
              </Text>
            </View>
          </LiquidGlassView>
        </View>
      </View>
    </LiquidGlassView>
  );
}

// Posiciona um nó pelo centro (coordenadas do viewBox) usando porcentagens do palco.
function nodeBox(x: number, y: number, size: number): ViewStyle {
  return {
    width: size,
    height: size,
    left: `${(x / VIEWBOX_WIDTH) * 100}%`,
    top: `${(y / VIEWBOX_HEIGHT) * 100}%`,
    marginLeft: -size / 2,
    marginTop: -size / 2,
  };
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    aspectRatio: VIEWBOX_WIDTH / VIEWBOX_HEIGHT,
  },
  node: {
    position: 'absolute',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
