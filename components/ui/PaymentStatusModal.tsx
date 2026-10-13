'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, RefreshCw, Receipt } from 'lucide-react';
import { ThinkingOrb } from 'thinking-orbs';
import { ReceiptPrinterModal, type ReceiptTicketData } from './ReceiptPrinter';

export type PaymentModalStatus = 'success' | 'failed' | 'pending' | 'loading';

export interface PaymentStatusModalProps {
  isOpen?: boolean;
  status: PaymentModalStatus;
  heading?: string;
  description?: string;
  primaryButtonText?: string;
  onPrimaryClick?: () => void;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  onSecondaryClick?: () => void;
  secondaryButtonHref?: string;
  isLoadingAction?: boolean;
  onClose?: () => void;
  isStandalonePage?: boolean;
  showReceiptButton?: boolean;
  onReceiptClick?: () => void;
  ticketData?: ReceiptTicketData;
}

/**
 * 4-circles grid icon matching the reference design button
 */
function FourDotsIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <circle cx="4.7" cy="4.7" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.3" cy="4.7" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.7" cy="11.3" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11.3" cy="11.3" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function PaymentStatusModal({
  isOpen = true,
  status,
  heading,
  description,
  primaryButtonText,
  onPrimaryClick,
  primaryButtonHref,
  secondaryButtonText,
  onSecondaryClick,
  secondaryButtonHref,
  isLoadingAction = false,
  onClose,
  isStandalonePage = false,
  showReceiptButton = true,
  onReceiptClick,
  ticketData,
}: PaymentStatusModalProps) {
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Support Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Defaults strictly derived from master prompt
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const isPending = status === 'pending';
  const isLoading = status === 'loading';

  const defaultHeading = isSuccess
    ? 'Transaction Successful'
    : isFailed
    ? 'Payment Failed'
    : isPending
    ? 'Payment Processing'
    : 'Confirming payment...';

  const defaultDescription = isSuccess
    ? 'Your transaction completed successfully and you can continue your work without any delay now.'
    : isFailed
    ? "We couldn't complete your payment. Please try again or choose another payment method."
    : isPending
    ? 'Cashfree is awaiting bank confirmation. Your account will automatically activate once confirmed.'
    : 'Verifying payment authorization with Cashfree Payments. Please do not close this window.';

  const displayHeading = heading || defaultHeading;
  const displayDescription = description || defaultDescription;

  const defaultPrimaryText = isSuccess
    ? 'Got it'
    : isFailed
    ? 'Try Again'
    : isPending
    ? 'Re-check Status'
    : 'Please wait';

  const displayPrimaryText = primaryButtonText || defaultPrimaryText;

  // Primary action button rendering
  const renderPrimaryButton = () => {
    const buttonBaseClasses = `w-full h-11 sm:h-12 rounded-full font-semibold text-[13px] sm:text-[14px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] select-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
      isSuccess
        ? 'bg-[#39B394] hover:bg-[#32A385] text-white shadow-[0_4px_14px_rgba(57,179,148,0.28)]'
        : isFailed
        ? 'bg-[#D94B4B] hover:bg-[#C83E3E] text-white shadow-[0_4px_14px_rgba(217,75,75,0.28)]'
        : isPending
        ? 'bg-[#171717] hover:bg-[#262626] text-white shadow-sm'
        : 'bg-slate-200 text-slate-400'
    }`;

    const content = (
      <>
        {isLoadingAction ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {isSuccess && <FourDotsIcon className="w-4 h-4 shrink-0" />}
            {isPending && <RefreshCw className="w-4 h-4 shrink-0" />}
            <span>{displayPrimaryText}</span>
          </>
        )}
      </>
    );

    if (primaryButtonHref && !isLoadingAction) {
      return (
        <Link href={primaryButtonHref} className={buttonBaseClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onPrimaryClick}
        disabled={isLoading || isLoadingAction}
        className={buttonBaseClasses}
      >
        {content}
      </button>
    );
  };

  // Receipt button in success state
  const renderReceiptButton = () => {
    if (!isSuccess || showReceiptButton === false) return null;

    return (
      <button
        type="button"
        onClick={() => {
          if (onReceiptClick) {
            onReceiptClick();
          } else {
            setIsReceiptModalOpen(true);
          }
        }}
        className="w-full mt-2.5 h-11 sm:h-12 rounded-full font-semibold text-[13px] sm:text-[14px] bg-[#F3F4F6] hover:bg-[#E5E7EB] active:scale-[0.98] text-[#171717] border border-slate-200/60 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs select-none"
      >
        <Receipt className="w-4 h-4 text-slate-600" />
        <span>Receipt</span>
      </button>
    );
  };

  // Secondary action rendering (e.g. Cancel on failed state)
  const renderSecondaryAction = () => {
    const text = secondaryButtonText || (isFailed ? 'Cancel' : null);
    if (!text) return null;

    if (secondaryButtonHref) {
      return (
        <Link
          href={secondaryButtonHref}
          className="mt-3 block text-center text-[12px] sm:text-[13px] text-[#66666F] hover:text-[#171717] font-medium transition-colors"
        >
          {text}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={onSecondaryClick || onClose}
        className="mt-3 w-full text-center text-[12px] sm:text-[13px] text-[#66666F] hover:text-[#171717] font-medium transition-colors cursor-pointer"
      >
        {text}
      </button>
    );
  };

  const cardContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-heading"
      className="w-full max-w-[340px] sm:max-w-[360px] bg-[#FFFFFF] rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-black/[0.04] p-7 sm:p-8 text-center relative overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200"
    >
      {/* 3D Icon Asset Display */}
      <div className="flex items-center justify-center pt-1 pb-5">
        {isSuccess && (
          <div className="relative w-[88px] h-[88px] sm:w-[94px] sm:h-[94px] flex items-center justify-center">
            <Image
              src="/payment/payment-success-3d.png"
              alt="Transaction Successful"
              width={94}
              height={94}
              priority
              className="object-contain drop-shadow-[0_8px_16px_rgba(57,179,148,0.15)] select-none pointer-events-none"
            />
          </div>
        )}

        {isFailed && (
          <div className="relative w-[88px] h-[88px] sm:w-[94px] sm:h-[94px] flex items-center justify-center">
            <Image
              src="/payment/payment-failed-3d.png"
              alt="Payment Failed"
              width={94}
              height={94}
              priority
              className="object-contain drop-shadow-[0_8px_16px_rgba(217,75,75,0.15)] select-none pointer-events-none"
            />
          </div>
        )}

        {isPending && (
          <div className="w-[88px] h-[88px] sm:w-[94px] sm:h-[94px] rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <RefreshCw className="w-10 h-10 animate-spin" />
          </div>
        )}

        {isLoading && (
          <div className="w-[88px] h-[88px] sm:w-[94px] sm:h-[94px] rounded-full bg-emerald-500/10 text-[#39B394] flex items-center justify-center">
            <ThinkingOrb state="listening" size={64} color="#39B394" theme="light" dotSize={1.3} />
          </div>
        )}
      </div>

      {/* Heading */}
      <h2
        id="payment-modal-heading"
        className="text-[17px] sm:text-[18px] font-bold text-[#171717] tracking-tight mb-2 select-none"
      >
        {displayHeading}
      </h2>

      {/* Description */}
      <p className="text-[12px] sm:text-[13px] text-[#66666F] leading-relaxed max-w-[270px] mx-auto mb-7 select-none">
        {displayDescription}
      </p>

      {/* Action Buttons */}
      <div className="w-full">
        {renderPrimaryButton()}
        {renderReceiptButton()}
        {renderSecondaryAction()}
      </div>
    </div>
  );

  return (
    <>
      {/* Main Payment Status Modal or Standalone View */}
      {isStandalonePage ? (
        <div className="min-h-screen bg-[#E9E9ED] flex items-center justify-center p-4">
          {cardContent}
        </div>
      ) : (
        <div
          className="fixed inset-0 z-50 bg-[#E9E9ED]/80 backdrop-blur-xs flex items-center justify-center p-4 transition-all"
          onClick={(e) => {
            if (e.target === e.currentTarget && onClose) {
              onClose();
            }
          }}
        >
          {cardContent}
        </div>
      )}

      {/* Receipt Printing Animation Modal (Triggers on Receipt Button Click) */}
      <ReceiptPrinterModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        ticketData={ticketData}
      />
    </>
  );
}
