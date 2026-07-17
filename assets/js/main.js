"use strict";

const plans = Object.freeze({
    "14GB": {
        family: "Start",
        composition: "8GB + 6GB de bônus",
        price: "R$ 59,99"
    },
    "17GB": {
        family: "Start",
        composition: "14GB + 3GB de bônus",
        price: "R$ 69,99"
    },
    "22GB": {
        family: "Start",
        composition: "21GB + 1GB de bônus",
        price: "R$ 84,99"
    },
    "38GB": {
        family: "Turbo",
        composition: "29GB + 9GB de bônus",
        price: "R$ 109,99"
    },
    "58GB": {
        family: "Turbo",
        composition: "39GB + 19GB de bônus",
        price: "R$ 129,99"
    },
    "68GB": {
        family: "Turbo",
        composition: "44GB + 24GB de bônus",
        price: "R$ 149,99"
    }
});

const contractApps = Object.freeze([
    {
        name: "Deezer",
        image: "assets/images/deezer.png"
    },
    {
        name: "SKY+",
        image: "assets/images/sky.png"
    },
    {
        name: "Kaspersky",
        image: "assets/images/kapersky.png"
    },
    {
        name: "Looke",
        image: "assets/images/looke.png"
    },
    {
        name: "Fluid",
        image: "assets/images/fluid.png"
    },
    {
        name: "Hub Vantagens",
        image: "assets/images/hub_vantagens.png"
    },
    {
        name: "Hube",
        image: "assets/images/hube.png"
    },
    {
        name: "Social Comics",
        image: "assets/images/social_comics.png"
    },
    {
        name: "Pequenos Leitores",
        image: "assets/images/pequenos_leitores.png"
    },
    {
        name: "Estuda+",
        image: "assets/images/estuda_mais.png"
    },
    {
        name: "Ubook",
        image: "assets/images/ubook.png"
    },
    {
        name: "PlayKids",
        image: "assets/images/play_kids.png"
    },
    {
        name: "NoPing",
        image: "assets/images/noping.png"
    }
]);

const state = {
    plan: localStorage.getItem("atlNexPlan") || "",
    chip: "",
    numberType: "",
    app: ""
};

const contractState = {
    plan: "",
    app: ""
};

function normalizeSlug(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
}

function getPathSegments() {
    return window.location.pathname
        .split("/")
        .map((segment) => {
            try {
                return normalizeSlug(decodeURIComponent(segment));
            } catch {
                return normalizeSlug(segment);
            }
        })
        .filter(Boolean);
}

function getConsultantSlug() {
    const segments = getPathSegments();
    const consultants = window.ATL_NEX_CONSULTORES || {};

    return segments.length &&
        Object.prototype.hasOwnProperty.call(consultants, segments[0])
        ? segments[0]
        : "";
}

function getWhatsAppNumber() {
    const consultants = window.ATL_NEX_CONSULTORES || {};
    const slug = getConsultantSlug();
    const selected = slug ? consultants[slug] : consultants.__default;

    return typeof selected === "string" && /^\d{12,13}$/.test(selected)
        ? selected
        : "";
}

function pageUrl(page, hash = "") {
    const slug = getConsultantSlug();
    const isLocalFile = window.location.protocol === "file:";

    if (isLocalFile) {
        const filename = page === "home" ? "index.html" : `${page}.html`;
        return `${filename}${hash}`;
    }

    if (slug) {
        const route = page === "home" ? `/${slug}` : `/${slug}/${page}`;
        return `${route}${hash}`;
    }

    return page === "home" ? `/${hash}` : `/${page}${hash}`;
}

function configureInternalLinks() {
    document.querySelectorAll("[data-page]").forEach((link) => {
        link.href = pageUrl(link.dataset.page || "home", link.dataset.hash || "");
    });
}

function setActiveNav() {
    const segments = getPathSegments();
    const slug = getConsultantSlug();
    const pageSegment = slug ? segments[1] : segments[0];
    const currentPage = pageSegment || "home";

    document.querySelectorAll("[data-nav]").forEach((link) => {
        link.classList.toggle("active", link.dataset.nav === currentPage);
    });
}

function configureMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".main-nav");

    if (!toggle || !nav) {
        return;
    }

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("open");

        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            nav.classList.remove("open");
            toggle.setAttribute("aria-expanded", "false");
        });
    });
}

function configureReveal() {
    const elements = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
}

function showToast(message) {
    const toast = document.querySelector(".toast");

    if (!toast) {
        return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timer);

    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

function selectChoice(group, value) {
    state[group] = value;

    document.querySelectorAll(`[data-choice="${group}"]`).forEach((button) => {
        button.classList.toggle("selected", button.dataset.value === value);
    });

    if (group === "plan") {
        localStorage.setItem("atlNexPlan", value);

        document.querySelectorAll("[data-plan]").forEach((card) => {
            card.classList.toggle("selected", card.dataset.plan === value);
        });
    }

    updateSummary();
}

function updateSummary() {
    const plan = plans[state.plan];

    const values = {
        plan: plan ? `${state.plan} · ${plan.price}` : "Não escolhido",
        chip: state.chip || "Não escolhido",
        numberType: state.numberType || "Não escolhido",
        app: state.app || "Não escolhido"
    };

    Object.entries(values).forEach(([key, value]) => {
        const target = document.querySelector(`[data-summary="${key}"]`);

        if (target) {
            target.textContent = value;
        }
    });

    document.querySelectorAll("[data-whatsapp-final]").forEach((button) => {
        const complete = Boolean(
            state.plan &&
            state.chip &&
            state.numberType &&
            state.app
        );

        button.disabled = !complete;
        button.style.opacity = complete ? "1" : "0.55";
        button.style.cursor = complete ? "pointer" : "not-allowed";
    });
}

function configureChoices() {
    document.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
            selectChoice(button.dataset.choice, button.dataset.value);
        });
    });

    document.querySelectorAll("[data-plan-select]").forEach((button) => {
        button.addEventListener("click", () => {
            const plan = button.dataset.planSelect;

            localStorage.setItem("atlNexPlan", plan);
            state.plan = plan;

            const configurator = document.querySelector("#configurador");

            if (configurator) {
                selectChoice("plan", plan);
                configurator.scrollIntoView({ behavior: "smooth", block: "start" });
            } else {
                window.location.href = pageUrl("home", "#configurador");
            }
        });
    });

    if (state.plan && plans[state.plan]) {
        selectChoice("plan", state.plan);
    } else {
        updateSummary();
    }
}

function buildWhatsAppMessage() {
    const plan = plans[state.plan];

    return [
        "Olá! Tenho interesse em contratar um plano ATL NEX.",
        "",
        `Plano escolhido: ${state.plan} (${plan.price})`,
        `Composição: ${plan.composition}`,
        `Formato do chip: ${state.chip}`,
        `Opção de número: ${state.numberType}`,
        `App de benefício: ${state.app}`,
        "",
        "Gostaria de prosseguir com o fechamento da compra e a ativação."
    ].join("\n");
}

function openWhatsApp() {
    if (!state.plan || !state.chip || !state.numberType || !state.app) {
        showToast("Escolha o plano, o formato do chip, a opção de número e o benefício.");
        return;
    }

    const number = getWhatsAppNumber();

    if (!number) {
        showToast("Cadastre um número de consultor em assets/js/consultores.js.");
        return;
    }

    const url = `https://wa.me/${number}?text=${encodeURIComponent(buildWhatsAppMessage())}`;

    window.open(url, "_blank", "noopener,noreferrer");
}

function configureWhatsApp() {
    document.querySelectorAll("[data-whatsapp-final]").forEach((button) => {
        button.addEventListener("click", openWhatsApp);
    });

    document.querySelectorAll("[data-whatsapp-simple]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            const number = getWhatsAppNumber();

            if (!number) {
                showToast("Cadastre um número de consultor em assets/js/consultores.js.");
                return;
            }

            const message = "Olá! Quero conhecer os planos ATL NEX e preciso de ajuda para escolher.";

            window.open(
                `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });
    });
}

function configureFaq() {
    document.querySelectorAll(".faq-question").forEach((button) => {
        button.addEventListener("click", () => {
            const item = button.closest(".faq-item");
            const answer = item?.querySelector(".faq-answer");

            if (!item || !answer) {
                return;
            }

            const isOpen = item.classList.toggle("open");

            answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : "0";
        });
    });
}

function configureNexPlansCarousel() {
    const plansCarousel = document.querySelector("[data-nex-plans-carousel]");

    if (!plansCarousel) {
        return;
    }

    const viewport = plansCarousel.querySelector("[data-nex-plans-viewport]");
    const track = plansCarousel.querySelector("[data-nex-plans-track]");
    const prevButton = plansCarousel.querySelector("[data-nex-plans-prev]");
    const nextButton = plansCarousel.querySelector("[data-nex-plans-next]");
    const cards = Array.from(track?.querySelectorAll(".nex-plan-card") || []);

    if (!viewport || !track || !prevButton || !nextButton || !cards.length) {
        return;
    }

    let currentIndex = 0;

    function getVisibleCards() {
        if (window.innerWidth <= 840) {
            return 1;
        }

        if (window.innerWidth <= 1180) {
            return 2;
        }

        return 3;
    }

    function getCardStep() {
        const firstCard = cards[0];
        const styles = window.getComputedStyle(track);
        const gap = parseFloat(styles.gap || styles.columnGap || "0") || 0;

        return firstCard.getBoundingClientRect().width + gap;
    }

    function getMaxIndex() {
        const visibleCards = getVisibleCards();

        return Math.max(0, cards.length - visibleCards);
    }

    function updateCarousel() {
        const step = getCardStep();
        const translateX = currentIndex * step;

        track.style.transform = `translate3d(-${translateX}px, 0, 0)`;

        prevButton.disabled = currentIndex <= 0;
        nextButton.disabled = currentIndex >= getMaxIndex();

        prevButton.style.opacity = currentIndex <= 0 ? "0.45" : "1";
        nextButton.style.opacity = currentIndex >= getMaxIndex() ? "0.45" : "1";
    }

    prevButton.addEventListener("click", () => {
        currentIndex = Math.max(0, currentIndex - 1);
        updateCarousel();
    });

    nextButton.addEventListener("click", () => {
        currentIndex = Math.min(getMaxIndex(), currentIndex + 1);
        updateCarousel();
    });

    window.addEventListener("resize", () => {
        const maxIndex = getMaxIndex();

        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }

        updateCarousel();
    });

    updateCarousel();
}

function renderContractApps() {
    const track = document.querySelector("[data-contract-apps-track]");

    if (!track) {
        return;
    }

    track.innerHTML = contractApps.map((app) => {
        return `
            <button
                class="plan-contract-app"
                type="button"
                data-contract-app
                data-app="${app.name}"
                aria-pressed="false"
            >
                <span class="plan-contract-app__image">
                    <img src="${app.image}" alt="${app.name}">
                </span>

                <span class="plan-contract-app__name">
                    ${app.name}
                </span>
            </button>
        `;
    }).join("");
}

function formatCpf(value) {
    return value
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function getSelectedRadioValue(form, name) {
    const selected = form.querySelector(`input[name="${name}"]:checked`);

    return selected ? selected.value : "";
}

function setPlanContractError(message = "") {
    const error = document.querySelector("[data-plan-contract-error]");

    if (error) {
        error.textContent = message;
    }
}

function openPlanContractModal(planName) {
    const modal = document.querySelector("[data-plan-contract-modal]");

    if (!modal) {
        showToast("Formulário de contratação não encontrado no index.html.");
        return;
    }

    const plan = plans[planName];

    if (!plan) {
        showToast("Plano não identificado.");
        return;
    }

    contractState.plan = planName;
    contractState.app = "";

    const form = modal.querySelector("[data-plan-contract-form]");
    const planTarget = modal.querySelector("[data-contract-selected-plan]");
    const priceTarget = modal.querySelector("[data-contract-selected-price]");

    if (form) {
        form.reset();
    }

    modal.querySelectorAll("[data-contract-app]").forEach((button) => {
        button.classList.remove("is-selected");
        button.setAttribute("aria-pressed", "false");
    });

    if (planTarget) {
        planTarget.textContent = `${planName} · ${plan.composition}`;
    }

    if (priceTarget) {
        priceTarget.textContent = plan.price;
    }

    setPlanContractError("");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closePlanContractModal() {
    const modal = document.querySelector("[data-plan-contract-modal]");

    if (!modal) {
        return;
    }

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    setPlanContractError("");
}

function buildContractWhatsAppMessage(form) {
    const planName = contractState.plan;
    const plan = plans[planName];

    const name = String(form.nome?.value || "").trim();
    const email = String(form.email?.value || "").trim();
    const cpf = String(form.cpf?.value || "").trim();
    const chip = getSelectedRadioValue(form, "chip");
    const portability = getSelectedRadioValue(form, "portabilidade");
    const energyDiscount = form.energia?.checked
        ? "Sim, quero simular com o consultor"
        : "Não solicitado";

    return [
        "Olá! Quero contratar um plano ATL NEX.",
        "",
        "*Dados do cliente*",
        `Nome: ${name}`,
        `E-mail: ${email}`,
        `CPF: ${cpf}`,
        "",
        "*Plano escolhido*",
        `Plano: ${planName}`,
        `Composição: ${plan.composition}`,
        `Mensalidade: ${plan.price}`,
        "Internet acumulativa: Sim",
        "",
        "*Escolhas do cliente*",
        `Formato: ${chip}`,
        `Portabilidade: ${portability}`,
        `APP 100% grátis escolhido: ${contractState.app}`,
        `Desconto energia elétrica: ${energyDiscount}`,
        "",
        "Gostaria de continuar a contratação pelo WhatsApp."
    ].join("\n");
}

function configurePlanContractModal() {
    renderContractApps();

    document.querySelectorAll("[data-open-plan-form]").forEach((button) => {
        button.addEventListener("click", () => {
            openPlanContractModal(button.dataset.plan || "");
        });
    });

    document.querySelectorAll("[data-plan-contract-close]").forEach((button) => {
        button.addEventListener("click", closePlanContractModal);
    });

    document.addEventListener("keydown", (event) => {
        const modal = document.querySelector("[data-plan-contract-modal]");

        if (
            event.key === "Escape" &&
            modal &&
            modal.classList.contains("is-open")
        ) {
            closePlanContractModal();
        }
    });

    document.querySelectorAll("[data-contract-app]").forEach((button) => {
        button.addEventListener("click", () => {
            contractState.app = button.dataset.app || "";

            document.querySelectorAll("[data-contract-app]").forEach((item) => {
                const selected = item === button;

                item.classList.toggle("is-selected", selected);
                item.setAttribute("aria-pressed", selected ? "true" : "false");
            });

            setPlanContractError("");
        });
    });

    const cpfInput = document.querySelector("[data-contract-cpf]");

    if (cpfInput) {
        cpfInput.addEventListener("input", () => {
            cpfInput.value = formatCpf(cpfInput.value);
        });
    }

    const appViewport = document.querySelector("[data-contract-apps-viewport]");
    const appPrev = document.querySelector("[data-contract-apps-prev]");
    const appNext = document.querySelector("[data-contract-apps-next]");

    if (appViewport && appPrev && appNext) {
        appPrev.addEventListener("click", () => {
            appViewport.scrollBy({
                left: -260,
                behavior: "smooth"
            });
        });

        appNext.addEventListener("click", () => {
            appViewport.scrollBy({
                left: 260,
                behavior: "smooth"
            });
        });
    }

    const form = document.querySelector("[data-plan-contract-form]");

    if (!form) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = String(form.nome?.value || "").trim();
        const email = String(form.email?.value || "").trim();
        const cpf = String(form.cpf?.value || "").trim();
        const cpfDigits = cpf.replace(/\D/g, "");
        const chip = getSelectedRadioValue(form, "chip");
        const portability = getSelectedRadioValue(form, "portabilidade");

        if (!contractState.plan || !plans[contractState.plan]) {
            setPlanContractError("Plano não identificado. Feche e escolha novamente.");
            return;
        }

        if (!chip) {
            setPlanContractError("Escolha se deseja chip físico ou eSIM.");
            return;
        }

        if (!portability) {
            setPlanContractError("Informe se deseja portabilidade ou número novo.");
            return;
        }

        if (!contractState.app) {
            setPlanContractError("Escolha um dos 13 aplicativos disponíveis.");
            return;
        }

        if (name.length < 3) {
            setPlanContractError("Digite seu nome completo.");
            form.nome?.focus();
            return;
        }

        if (!email || !form.email?.checkValidity()) {
            setPlanContractError("Digite um e-mail válido.");
            form.email?.focus();
            return;
        }

        if (cpfDigits.length !== 11) {
            setPlanContractError("Digite um CPF válido com 11 números.");
            form.cpf?.focus();
            return;
        }

        const number = getWhatsAppNumber();

        if (!number) {
            setPlanContractError("O WhatsApp do consultor não está configurado em assets/js/consultores.js.");
            return;
        }

        const message = buildContractWhatsAppMessage(form);
        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

        window.open(url, "_blank", "noopener,noreferrer");

        closePlanContractModal();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    configureInternalLinks();
    setActiveNav();
    configureMenu();
    configureReveal();
    configureChoices();
    configureWhatsApp();
    configureFaq();
    configureNexPlansCarousel();
    configurePlanContractModal();
});