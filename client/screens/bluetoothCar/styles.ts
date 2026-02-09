import { StyleSheet } from 'react-native';

interface LayoutMetrics {
  horizontalPadding: number;
  topPadding: number;
  bottomPadding: number;
  topBarHeight: number;
  topBarTop: number;
  joystickSlotWidth: number;
  centerSlotWidth: number;
  buttonSlotWidth: number;
  buttonAreaHeight: number;
  labelFontSize: number;
  statusFontSize: number;
  backgroundColor: string;
}

export const createStyles = (layout: LayoutMetrics) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.horizontalPadding,
    paddingTop: layout.topPadding,
    paddingBottom: layout.bottomPadding,
    backgroundColor: layout.backgroundColor,
  },
  topBar: {
    position: 'absolute',
    top: layout.topBarTop,
    left: layout.horizontalPadding,
    right: layout.horizontalPadding,
    height: layout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flex: 1,
    marginRight: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusText: {
    fontSize: layout.statusFontSize,
    color: '#E5E7EB',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  connectButton: {
    backgroundColor: '#2563EB',
  },
  disconnectButton: {
    backgroundColor: '#DC2626',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: layout.statusFontSize,
    fontWeight: '700',
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  joystickSlot: {
    width: layout.joystickSlotWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSpacer: {
    width: layout.centerSlotWidth,
  },
  joystickLabel: {
    marginBottom: 10,
    fontSize: layout.labelFontSize,
    color: '#E5E7EB',
    fontWeight: '600',
  },
  buttonArea: {
    height: layout.buttonAreaHeight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonRow: {
    width: layout.buttonSlotWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
