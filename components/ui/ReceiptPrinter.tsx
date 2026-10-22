'use client';

import React, {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle, Loader2, Printer, X, Download } from 'lucide-react';
import { cn } from '@/helpers/classname-helper';

export type ReceiptPrinterStage = 'processing' | 'printing' | 'complete';
export type ReceiptFeedMotion = 'smooth' | 'stepped';

export type ReceiptPrinterRootProps = Omit<
  ComponentPropsWithoutRef<'section'>,
  'children'
> & {
  animate?: boolean;
  children: ReactNode;
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
};

export type ReceiptPrinterMachineProps = ComponentPropsWithoutRef<'div'>;
export type ReceiptPrinterHeaderProps = ComponentPropsWithoutRef<'div'>;
export type ReceiptPrinterScreenProps = ComponentPropsWithoutRef<'div'>;
export type ReceiptPrinterOutputProps = ComponentPropsWithoutRef<'div'>;
export type ReceiptPrinterPaperProps = ComponentPropsWithoutRef<'article'>;

export type ReceiptPrinterStatusProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  children?: ReactNode;
};

type ReceiptPrinterContextValue = {
  animate: boolean;
  feedMotion: ReceiptFeedMotion;
  shouldMove: boolean;
  stage: ReceiptPrinterStage;
};

const ReceiptPrinterContext = createContext<ReceiptPrinterContextValue | null>(
  null,
);

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

const receiptToothCount = 40;
const receiptToothDepth = 5;
const receiptToothPoints = Array.from(
  { length: receiptToothCount * 2 },
  (_, index) => {
    const x = 100 - ((index + 1) * 100) / (receiptToothCount * 2);
    const y = index % 2 === 0 ? '100%' : `calc(100% - ${receiptToothDepth}px)`;
    return `${x}% ${y}`;
  },
).join(', ');

const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${receiptToothDepth}px), ${receiptToothPoints})`;

const printingTransformKeyframes = [
  'translateY(calc(-100% + 2px))',
  'translateY(-91%)',
  'translateY(-91%)',
  'translateY(-81%)',
  'translateY(-81%)',
  'translateY(-70%)',
  'translateY(-70%)',
  'translateY(-58%)',
  'translateY(-58%)',
  'translateY(-45%)',
  'translateY(-45%)',
  'translateY(-32%)',
  'translateY(-32%)',
  'translateY(-20%)',
  'translateY(-20%)',
  'translateY(-10%)',
  'translateY(-10%)',
  'translateY(-3%)',
  'translateY(-3%)',
  'translateY(0%)',
];

const printingKeyframeTimes = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
];

const statusLabels: Record<ReceiptPrinterStage, ReactNode> = {
  processing: 'Processing your order',
  printing: 'Printing your receipt',
  complete: 'Order complete',
};

function useReceiptPrinter(component: string) {
  const context = useContext(ReceiptPrinterContext);
  if (!context) {
    throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  }
  return context;
}

function ReceiptPrinterRoot({
  'aria-label': ariaLabel = 'Receipt printer',
  animate = true,
  children,
  className,
  feedMotion = 'stepped',
  stage,
  ...props
}: ReceiptPrinterRootProps) {
  const shouldReduceMotion = useReducedMotion();
  const context = {
    animate,
    feedMotion,
    shouldMove: animate && !shouldReduceMotion,
    stage,
  };

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section
        aria-label={ariaLabel}
        className={cn(
          'relative isolate flex w-full max-w-sm flex-col items-center',
          className,
        )}
        data-stage={stage}
        {...props}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

function ReceiptPrinterMachine({
  children,
  className,
  ...props
}: ReceiptPrinterMachineProps) {
  return (
    <div
      className={cn(
        'relative isolate w-full overflow-hidden rounded-[1.5rem] border border-slate-700/80 bg-slate-900 p-3 pb-8 text-white shadow-[0_20px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]',
        className,
      )}
      {...props}
    >
      {children}
      {/* Printer slot dispenser at the bottom */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-3 z-40 h-2 rounded-sm border border-slate-800 bg-black shadow-inner shadow-black"
      />
    </div>
  );
}

function ReceiptPrinterHeader({
  children,
  className,
  ...props
}: ReceiptPrinterHeaderProps) {
  return (
    <div
      className={cn('relative z-10 flex h-10 items-center justify-between px-1', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function ReceiptPrinterScreen({
  children,
  className,
  ...props
}: ReceiptPrinterScreenProps) {
  return (
    <div
      className={cn(
        'relative z-10 isolate overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-slate-200 shadow-inner shadow-black/80',
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StatusIndicator({
  animate,
  move,
  stage,
}: {
  animate: boolean;
  move: boolean;
  stage: ReceiptPrinterStage;
}) {
  const isComplete = stage === 'complete';

  return (
    <span
      aria-hidden="true"
      className="relative grid size-5 shrink-0 place-items-center"
    >
      <AnimatePresence initial={false} mode="sync">
        {isComplete ? (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-emerald-400"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="complete"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <CheckCircle className="w-4 h-4 fill-emerald-500/20 text-emerald-400" />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-slate-400"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="working"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <Loader2
              className={cn(
                'w-4 h-4',
                animate && 'animate-spin motion-reduce:animate-none',
              )}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function ReceiptPrinterStatus({
  children,
  className,
  ...props
}: ReceiptPrinterStatusProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter(
    'ReceiptPrinter.Status',
  );

  return (
    <div
      className={cn('flex min-w-0 items-center gap-2', className)}
      {...props}
    >
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div
        aria-live="polite"
        className="grid min-w-0 flex-1 items-center"
        role="status"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            className="col-start-1 row-start-1 truncate font-medium text-slate-300 text-xs leading-none"
            exit={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(-4px)' : 'translateY(0px)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(4px)' : 'translateY(0px)',
            }}
            key={stage}
            transition={{ duration: animate ? 0.18 : 0, ease: easeOut }}
          >
            {children ?? statusLabels[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReceiptPrinterPaper({
  children,
  className,
  style,
  ...props
}: ReceiptPrinterPaperProps) {
  return (
    <article
      className={cn(
        'relative z-10 w-full bg-white px-6 pt-7 pb-8 text-slate-900 shadow-2xl rounded-t-3xl',
        className,
      )}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {children}
    </article>
  );
}

function ReceiptPrinterOutput({
  children,
  className,
  ...props
}: ReceiptPrinterOutputProps) {
  const { animate, feedMotion, shouldMove, stage } = useReceiptPrinter(
    'ReceiptPrinter.Output',
  );
  const isReceiptVisible = stage !== 'processing';
  const shouldUseSteppedFeed =
    feedMotion === 'stepped' && stage === 'printing' && shouldMove;

  return (
    <div
      className={cn(
        'relative z-50 -mt-3 w-full max-w-full overflow-hidden px-4',
        className,
      )}
      {...props}
    >
      {isReceiptVisible ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-4 -top-1 z-20 h-2 bg-black/60 blur-[4px]"
        />
      ) : null}

      <motion.div
        animate={{
          opacity: isReceiptVisible ? 1 : 0,
          transform:
            stage === 'printing' && shouldMove
              ? shouldUseSteppedFeed
                ? printingTransformKeyframes
                : 'translateY(0%)'
              : isReceiptVisible || !shouldMove
                ? 'translateY(0%)'
                : 'translateY(calc(-100% + 2px))',
        }}
        aria-hidden={stage !== 'complete'}
        className="relative isolate"
        initial={false}
        transition={{
          opacity: { duration: animate ? 0.16 : 0, ease: easeOut },
          transform: {
            duration: shouldMove ? 1.75 : 0,
            ease: shouldUseSteppedFeed ? 'linear' : easeInOut,
            times: shouldUseSteppedFeed ? printingKeyframeTimes : undefined,
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};

/* -------------------------------------------------------------------------- */
/* Full Ticket Template Component Matching The User's Reference Image         */
/* -------------------------------------------------------------------------- */

export interface ReceiptTicketData {
  orderId?: string;
  /** Pre-formatted amount including currency symbol, e.g. ₹99.00 or $5.00 */
  amountText?: string;
  provider?: 'cashfree' | 'polar' | 'dodo';
  dateStr?: string;
  customerName?: string;
  planName?: string;
  paymentMethod?: string;
}

export function ReceiptTicketTemplate({
  data,
}: {
  data?: ReceiptTicketData;
}) {
  const orderId = data?.orderId || '0120034399434';
  const amount = data?.amountText || '—';
  const dateStr = data?.dateStr || new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }) + ` • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const customerName = data?.customerName || 'TheCore Developer';
  const planName = data?.planName || 'TheCore Pro';

  return (
    <div className="relative text-center select-none font-sans">
      {/* Top Floating 3D Ticket Badge with Colorful Rays */}
      <div className="relative inline-flex items-center justify-center mb-3">
        {/* Glow rays */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-4 flex justify-between px-1 pointer-events-none">
          <span className="w-1 h-2 rounded-full bg-blue-500 -rotate-20" />
          <span className="w-1 h-2.5 rounded-full bg-blue-600" />
          <span className="w-1 h-2 rounded-full bg-sky-400 rotate-20" />
        </div>
        <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-2 h-1 rounded-full bg-blue-400" />
        <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-2 h-1 rounded-full bg-blue-600" />

        {/* 3D Ticket Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center">
          <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-blue-400 via-blue-600 to-blue-700 flex items-center justify-center relative overflow-hidden">
            <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" fill="rgba(255,255,255,0.2)" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
        </div>
      </div>

      {/* Thank you title */}
      <h3 className="text-xl font-black text-slate-900 tracking-tight">Thank you!</h3>
      <p className="text-[12px] text-slate-500 mt-0.5">Your receipt has been issued successfully</p>

      {/* Notched perforated separator */}
      <div className="relative my-5">
        <div className="border-b-2 border-dashed border-slate-200" />
        {/* Left notch */}
        <div className="absolute -left-9 -top-2.5 w-5 h-5 rounded-full bg-slate-900 shadow-inner" />
        {/* Right notch */}
        <div className="absolute -right-9 -top-2.5 w-5 h-5 rounded-full bg-slate-900 shadow-inner" />
      </div>

      {/* Metadata Fields */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RECEIPT ID</div>
            <div className="text-[13px] font-mono font-bold text-slate-900 truncate max-w-[170px]">{orderId}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AMOUNT</div>
            <div className="text-base font-black text-slate-900">{amount}</div>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DATE & TIME</div>
          <div className="text-xs font-bold text-slate-900">{dateStr}</div>
        </div>

        {/* Customer & Card Info Card */}
        <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">{customerName}</div>
            <div className="text-[10px] text-slate-400 font-medium truncate">{planName} • Paid via {data?.provider === 'dodo' ? 'Dodo Payments' : data?.provider === 'polar' ? 'Polar' : 'Cashfree'}</div>
          </div>
        </div>
      </div>

      {/* Lower perforated dashed separator */}
      <div className="relative my-5">
        <div className="border-b-2 border-dashed border-slate-200" />
      </div>

      {/* Realistic Barcode section */}
      <div className="pt-1">
        <svg className="w-full h-12 max-h-12 mx-auto text-slate-900" viewBox="0 0 200 40" preserveAspectRatio="none">
          <rect x="4" y="0" width="3" height="40" fill="currentColor" />
          <rect x="10" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="14" y="0" width="4" height="40" fill="currentColor" />
          <rect x="21" y="0" width="2" height="40" fill="currentColor" />
          <rect x="26" y="0" width="5" height="40" fill="currentColor" />
          <rect x="34" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="38" y="0" width="3.5" height="40" fill="currentColor" />
          <rect x="44" y="0" width="2" height="40" fill="currentColor" />
          <rect x="49" y="0" width="6" height="40" fill="currentColor" />
          <rect x="58" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="62" y="0" width="4" height="40" fill="currentColor" />
          <rect x="69" y="0" width="2" height="40" fill="currentColor" />
          <rect x="74" y="0" width="5" height="40" fill="currentColor" />
          <rect x="82" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="86" y="0" width="3.5" height="40" fill="currentColor" />
          <rect x="92" y="0" width="2" height="40" fill="currentColor" />
          <rect x="97" y="0" width="6" height="40" fill="currentColor" />
          <rect x="106" y="0" width="2" height="40" fill="currentColor" />
          <rect x="111" y="0" width="4" height="40" fill="currentColor" />
          <rect x="118" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="122" y="0" width="5" height="40" fill="currentColor" />
          <rect x="130" y="0" width="3" height="40" fill="currentColor" />
          <rect x="136" y="0" width="2" height="40" fill="currentColor" />
          <rect x="141" y="0" width="4.5" height="40" fill="currentColor" />
          <rect x="148" y="0" width="2" height="40" fill="currentColor" />
          <rect x="153" y="0" width="5" height="40" fill="currentColor" />
          <rect x="161" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="165" y="0" width="3" height="40" fill="currentColor" />
          <rect x="171" y="0" width="4" height="40" fill="currentColor" />
          <rect x="178" y="0" width="1.5" height="40" fill="currentColor" />
          <rect x="182" y="0" width="5" height="40" fill="currentColor" />
          <rect x="190" y="0" width="2" height="40" fill="currentColor" />
        </svg>
        <p className="text-[10px] font-mono tracking-[0.25em] text-slate-500 mt-1.5">
          {orderId.slice(-14) || '2 8 9 3 7 2 6 1 2 7 3 6 1 0'}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Interactive Modal Container with Stage Transitioning                        */
/* -------------------------------------------------------------------------- */

export interface ReceiptPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData?: ReceiptTicketData;
}

export function ReceiptPrinterModal({
  isOpen,
  onClose,
  ticketData,
}: ReceiptPrinterModalProps) {
  const [stage, setStage] = useState<ReceiptPrinterStage>('processing');

  useEffect(() => {
    if (!isOpen) {
      setStage('processing');
      return;
    }

    // Stage 1: Processing (500ms)
    setStage('processing');
    const timer1 = setTimeout(() => {
      // Stage 2: Printing with stepped feed animation (2000ms)
      setStage('printing');
    }, 600);

    // Stage 3: Complete
    const timer2 = setTimeout(() => {
      setStage('complete');
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#E9E9ED]/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm flex items-center justify-center transition-colors cursor-pointer z-50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* The Receipt Printer Machine */}
        <ReceiptPrinter.Root stage={stage} feedMotion="stepped">
          <ReceiptPrinter.Machine className="w-full">
            <ReceiptPrinter.Header>
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-400 uppercase">
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>TheCore POS</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen>
              <ReceiptPrinter.Status />
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>

          {/* Dispensed Receipt Paper */}
          <ReceiptPrinter.Output className="w-full -mt-4">
            <ReceiptPrinter.Paper className="shadow-2xl">
              <ReceiptTicketTemplate data={ticketData} />
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>

        {/* Post-print Actions */}
        <AnimatePresence>
          {stage === 'complete' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.25 }}
              className="mt-6 flex items-center gap-3 w-full max-w-xs"
            >
              <button
                type="button"
                onClick={handlePrint}
                className="flex-1 h-11 rounded-full bg-[#171717] hover:bg-[#262626] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save Receipt</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-semibold text-xs border border-slate-200 flex items-center justify-center transition-all shadow-xs cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

