import { createSignal, onMount, Show } from 'solid-js';

interface UsageStats {
  apiName: string;
  dailyUsed: number;
  dailyQuota: number;
  dailyRemaining: number;
  monthlySpent: number;
  monthlyBudget: number;
  monthlyRemaining: number;
  percentUsed: number;
}

export function APIUsageDashboard() {
  const [stats, setStats] = createSignal<UsageStats | null>(null);
  const [warningLevel, setWarningLevel] = createSignal<string>('safe');
  const [message, setMessage] = createSignal<string>('');

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/admin/api-usage?api=google_places');
      const data = await response.json();
      setStats(data.stats);
      setWarningLevel(data.warningLevel);
      setMessage(data.message);
    } catch (error) {
      console.error('獲取使用量失敗:', error);
    }
  };

  onMount(() => {
    fetchStats();
    // 每分鐘更新一次
    setInterval(fetchStats, 60000);
  });

  const getProgressColor = () => {
    const percent = stats()?.percentUsed || 0;
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 80) return 'bg-orange-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getWarningIcon = () => {
    switch (warningLevel()) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'caution': return '📊';
      default: return '✅';
    }
  };

  return (
    <Show when={stats()}>
      <div class="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-6 w-80">
        {/* Header */}
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-lg">API 使用量監控</h3>
          <button
            onClick={fetchStats}
            class="text-blue-500 hover:text-blue-600"
            title="重新整理"
          >
            🔄
          </button>
        </div>

        {/* Warning Message */}
        <div class={`mb-4 p-3 rounded-lg ${
          warningLevel() === 'critical' ? 'bg-red-50 text-red-700' :
          warningLevel() === 'warning' ? 'bg-orange-50 text-orange-700' :
          warningLevel() === 'caution' ? 'bg-yellow-50 text-yellow-700' :
          'bg-green-50 text-green-700'
        }`}>
          <div class="flex items-start gap-2">
            <span class="text-xl">{getWarningIcon()}</span>
            <span class="text-sm font-medium">{message()}</span>
          </div>
        </div>

        {/* Monthly Budget Progress */}
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700">月預算使用率</span>
            <span class="text-sm font-bold text-gray-900">
              {stats()!.percentUsed.toFixed(1)}%
            </span>
          </div>

          <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              class={`h-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${Math.min(stats()!.percentUsed, 100)}%` }}
            />
          </div>

          <div class="flex items-center justify-between mt-2 text-xs text-gray-600">
            <span>${stats()!.monthlySpent.toFixed(2)}</span>
            <span>${stats()!.monthlyBudget.toFixed(2)}</span>
          </div>
        </div>

        {/* Daily Quota */}
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <div class="text-xs text-gray-600 mb-1">今日呼叫次數</div>
              <div class="text-2xl font-bold text-blue-600">
                {stats()!.dailyUsed}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-600 mb-1">配額</div>
              <div class="text-lg font-semibold text-gray-700">
                /{stats()!.dailyQuota}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div>
              <div class="text-xs text-gray-600 mb-1">剩餘額度</div>
              <div class="text-2xl font-bold text-purple-600">
                {stats()!.dailyRemaining}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xs text-gray-600 mb-1">剩餘預算</div>
              <div class="text-lg font-semibold text-gray-700">
                ${stats()!.monthlyRemaining.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Cost Estimate */}
        <div class="mt-4 pt-4 border-t">
          <div class="text-xs text-gray-500 space-y-1">
            <div class="flex justify-between">
              <span>每次呼叫成本:</span>
              <span class="font-semibold">$0.032</span>
            </div>
            <div class="flex justify-between">
              <span>免費額度:</span>
              <span class="font-semibold">$200/月</span>
            </div>
            <div class="flex justify-between">
              <span>預算上限:</span>
              <span class="font-semibold text-red-600">$150/月</span>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
}
