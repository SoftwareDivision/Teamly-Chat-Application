// Teamly Logo Component with pink gradient theme
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from 'teamly_shared';

interface TeamlyLogoProps {
  size?: number;
}

const TeamlyLogo: React.FC<TeamlyLogoProps> = ({ size = 120 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Defs>
          <LinearGradient id="pinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={Colors.gradientStart} />
            <Stop offset="100%" stopColor={Colors.gradientEnd} />
          </LinearGradient>
        </Defs>
        
        {/* Left person - lighter pink */}
        <Circle cx="30" cy="35" r="15" fill={Colors.gradientStart} opacity="0.8" />
        <Circle cx="30" cy="75" r="25" fill={Colors.gradientStart} opacity="0.8" />
        
        {/* Center person - gradient */}
        <Circle cx="60" cy="28" r="16" fill="url(#pinkGradient)" />
        <Circle cx="60" cy="75" r="30" fill="url(#pinkGradient)" />
        
        {/* Right person - darker pink */}
        <Circle cx="90" cy="35" r="15" fill={Colors.gradientEnd} opacity="0.9" />
        <Circle cx="90" cy="75" r="25" fill={Colors.gradientEnd} opacity="0.9" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TeamlyLogo;
