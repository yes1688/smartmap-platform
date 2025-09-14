import { Component } from 'solid-js';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: Component<LoadingOverlayProps> = (props) => {
  return (
    <div class="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col justify-center items-center z-[9999]">
      {/* Loading Spinner */}
      <div class="relative mb-4">
        <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-2xl">🌍</span>
        </div>
      </div>

      {/* Loading Message */}
      <div class="text-lg font-medium text-indigo-600 mb-2">
        {props.message || '載入中...'}
      </div>

      <div class="text-sm text-gray-600">
        正在初始化智能空間平台
      </div>
    </div>
  );
};

export default LoadingOverlay;