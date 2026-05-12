// ========== Confirmação de ações ==========
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-confirm]");

  if (!trigger) {
    return;
  }

  const message = trigger.getAttribute("data-confirm") || "Tem certeza que deseja continuar?";
  if (!window.confirm(message)) {
    event.preventDefault();
  }
});

// ========== Inicialização de gráficos Chart.js ==========
const chartInstances = {};

function getChartConfig(type, data, label) {
  const colors = {
    green: "rgb(34, 197, 94)",
    greenAlpha: "rgba(34, 197, 94, 0.1)",
    red: "rgb(239, 68, 68)",
    redAlpha: "rgba(239, 68, 68, 0.1)",
    blue: "rgb(59, 130, 246)",
    blueAlpha: "rgba(59, 130, 246, 0.1)",
    amber: "rgb(245, 158, 11)",
    amberAlpha: "rgba(245, 158, 11, 0.1)",
  };

  if (type === "monthlyChart") {
    return {
      type: "bar",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Receitas",
            data: data.map((d) => d.income),
            backgroundColor: colors.greenAlpha,
            borderColor: colors.green,
            borderWidth: 2,
            tension: 0.3,
          },
          {
            label: "Despesas",
            data: data.map((d) => d.expenses),
            backgroundColor: colors.redAlpha,
            borderColor: colors.red,
            borderWidth: 2,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    };
  }

  if (type === "categoriesChart") {
    return {
      type: "doughnut",
      data: {
        labels: data.map((d) => d.category),
        datasets: [
          {
            data: data.map((d) => d.total),
            backgroundColor: [
              colors.blue,
              colors.green,
              colors.red,
              colors.amber,
              "rgb(168, 85, 247)",
            ],
            borderColor: ["#ffffff"],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
        },
      },
    };
  }

  if (type === "budgetChart") {
    return {
      type: "bar",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: "Orçado",
            data: data.map((d) => d.budgeted),
            backgroundColor: colors.blueAlpha,
            borderColor: colors.blue,
            borderWidth: 2,
          },
          {
            label: "Realizado",
            data: data.map((d) => d.actual),
            backgroundColor: colors.amberAlpha,
            borderColor: colors.amber,
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    };
  }

  if (type === "categoryEvolutionChart") {
    return {
      type: "line",
      data: {
        labels: data.map((d) => d.month),
        datasets: [
          {
            label: label || "Evolução",
            data: data.map((d) => d.total),
            borderColor: colors.green,
            backgroundColor: colors.greenAlpha,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: colors.green,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                }).format(value);
              },
            },
          },
        },
      },
    };
  }
}

function initChart(canvasId, config) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js não foi carregado");
    return;
  }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Destruir instância anterior se existir
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
  }

  const ctx = canvas.getContext("2d");
  chartInstances[canvasId] = new Chart(ctx, config);
}

function initCharts() {
  // Monthly series (Receitas vs Despesas)
  const monthlyScriptEl = document.getElementById("monthlySeriesData");
  if (monthlyScriptEl) {
    try {
      const monthlySeries = JSON.parse(monthlyScriptEl.textContent);
      if (Array.isArray(monthlySeries) && monthlySeries.length > 0) {
        const config = getChartConfig("monthlyChart", monthlySeries);
        initChart("monthlyChart", config);
      }
    } catch (e) {
      console.error("Erro ao inicializar gráfico mensal:", e);
    }
  }

  // Top categories (Distribuição)
  const categoriesScriptEl = document.getElementById("topCategoriesData");
  if (categoriesScriptEl) {
    try {
      const topCategories = JSON.parse(categoriesScriptEl.textContent);
      if (Array.isArray(topCategories) && topCategories.length > 0) {
        const config = getChartConfig("categoriesChart", topCategories);
        initChart("categoriesChart", config);
      }
    } catch (e) {
      console.error("Erro ao inicializar gráfico de categorias:", e);
    }
  }

  // Budget series (Orçado vs Realizado)
  const budgetScriptEl = document.getElementById("budgetSeriesData");
  if (budgetScriptEl) {
    try {
      const budgetSeries = JSON.parse(budgetScriptEl.textContent);
      if (Array.isArray(budgetSeries) && budgetSeries.length > 0) {
        const config = getChartConfig("budgetChart", budgetSeries);
        initChart("budgetChart", config);
      }
    } catch (e) {
      console.error("Erro ao inicializar gráfico de orçamento:", e);
    }
  }
}

// ========== Handler para gráfico dinâmico por categoria ==========
function setupCategorySelect() {
  const categoryFilterSelect = document.getElementById("categoryFilterSelect");
  const container = document.getElementById("categoryEvolutionContainer");

  if (categoryFilterSelect && container) {
    categoryFilterSelect.addEventListener("change", async (event) => {
      const categoryId = event.target.value;

      if (!categoryId) {
        container.style.display = "none";
        return;
      }

      // Extrair parâmetros da URL
      const url = new URL(window.location.href);
      const params = new URLSearchParams();
      params.set("category_id", categoryId);
      if (url.searchParams.get("start")) params.set("start", url.searchParams.get("start"));
      if (url.searchParams.get("end")) params.set("end", url.searchParams.get("end"));

      try {
        const response = await fetch(`/api/dashboard/category-series?${params.toString()}`);
        if (!response.ok) {
          console.error("Erro na chamada de category-series:", response.statusText);
          container.style.display = "none";
          return;
        }
        const data = await response.json();

        if (!data.category_series || data.category_series.length === 0) {
          container.innerHTML = '<div style="padding: 2rem; text-align: center;"><p>Sem dados para esta categoria.</p></div>';
          container.style.display = "block";
          return;
        }

        // Criar canvas dinamicamente
        container.innerHTML = '<canvas id="dynamicCategoryChart"></canvas>';
        container.style.display = "block";

        const selectedOption = categoryFilterSelect.options[categoryFilterSelect.selectedIndex].text;
        const config = getChartConfig(
          "categoryEvolutionChart",
          data.category_series,
          selectedOption
        );
        initChart("dynamicCategoryChart", config);
      } catch (error) {
        console.error("Erro ao carregar categoria-series:", error);
        container.innerHTML = '<div style="padding: 2rem; text-align: center; color: red;"><p>Erro ao carregar os dados.</p></div>';
        container.style.display = "block";
      }
    });
  }
}

// Chamado diretamente — afterInteractive já garante que o DOM está pronto
// Retry para aguardar o Chart.js CDN ser carregado
function tryInitCharts(retries) {
  if (typeof Chart === "undefined") {
    if (retries > 0) {
      setTimeout(function () { tryInitCharts(retries - 1); }, 150);
    } else {
      console.warn("Chart.js não foi carregado após múltiplas tentativas");
    }
    return;
  }
  initCharts();
  setupCategorySelect();
}

tryInitCharts(20);
