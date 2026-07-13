import { Suspense } from 'react';
import RegisterForm from '../RegisterForm';

export default function RegisterVendeurPage() {
  return (
    <Suspense fallback={
      <div className="max-w-[1240px] w-full min-h-[600px] bg-white rounded-[10px] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.14)] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#d9704f] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm role="vendeur" />
    </Suspense>
  );
}
