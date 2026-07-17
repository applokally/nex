"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(
        "[data-free-apps-carousel]"
    );

    if (!carousel) {
        return;
    }

    const viewport = carousel.querySelector(
        "[data-free-apps-viewport]"
    );

    const track = carousel.querySelector(
        "[data-free-apps-track]"
    );

    const previousButton = carousel.querySelector(
        "[data-free-apps-prev]"
    );

    const nextButton = carousel.querySelector(
        "[data-free-apps-next]"
    );

    if (
        !viewport ||
        !track ||
        !previousButton ||
        !nextButton
    ) {
        return;
    }

    /*
     * Remove clones antigos caso o script seja executado
     * novamente durante o desenvolvimento.
     */
    track
        .querySelectorAll("[data-free-app-clone]")
        .forEach((clone) => clone.remove());

    const originalItems = Array.from(
        track.querySelectorAll(".free-app")
    );

    if (originalItems.length < 2) {
        return;
    }

    /*
     * Duplica todos os aplicativos para formar uma sequência
     * contínua sem espaço vazio entre o final e o início.
     */
    originalItems.forEach((item) => {
        const clone = item.cloneNode(true);

        clone.dataset.freeAppClone = "true";
        clone.setAttribute("aria-hidden", "true");

        track.appendChild(clone);
    });

    /*
     * VELOCIDADE DO CARROSSEL
     *
     * 50 = mais lento
     * 70 = velocidade recomendada
     * 90 = rápido
     * 110 = muito rápido
     */
    const pixelsPerSecond = 60;

    /*
     * Tempo da animação ao clicar nas setas.
     */
    const arrowAnimationDuration = 360;

    let groupWidth = 0;
    let positionX = 0;

    let animationFrameId = null;
    let lastFrameTime = performance.now();

    let isDragging = false;
    let pointerStartX = 0;
    let positionAtDragStart = 0;

    let arrowAnimation = null;
    let resizeTimer = null;

    function waitForImages() {
        const images = Array.from(
            track.querySelectorAll("img")
        );

        return Promise.all(
            images.map((image) => {
                if (image.complete) {
                    return Promise.resolve();
                }

                return new Promise((resolve) => {
                    image.addEventListener(
                        "load",
                        resolve,
                        { once: true }
                    );

                    image.addEventListener(
                        "error",
                        resolve,
                        { once: true }
                    );
                });
            })
        );
    }

    function calculateGroupWidth() {
        const firstOriginalItem = originalItems[0];

        const firstClone = track.querySelector(
            "[data-free-app-clone]"
        );

        if (!firstOriginalItem || !firstClone) {
            groupWidth = 0;
            return;
        }

        groupWidth =
            firstClone.offsetLeft -
            firstOriginalItem.offsetLeft;
    }

    function normalizePosition() {
        if (groupWidth <= 0) {
            return;
        }

        /*
         * Mantém a posição sempre dentro da primeira sequência,
         * sem que o usuário perceba o reinício.
         */
        positionX =
            ((positionX % groupWidth) - groupWidth) %
            groupWidth;
    }

    function renderPosition() {
        track.style.transform =
            `translate3d(${positionX}px, 0, 0)`;
    }

    function getItemStep() {
        const firstItem = originalItems[0];

        if (!firstItem) {
            return 172;
        }

        const styles = window.getComputedStyle(track);

        const gap =
            Number.parseFloat(
                styles.columnGap ||
                styles.gap ||
                "0"
            ) || 0;

        return (
            firstItem.getBoundingClientRect().width +
            gap
        );
    }

    function easeInOutCubic(progress) {
        if (progress < 0.5) {
            return (
                4 *
                progress *
                progress *
                progress
            );
        }

        return (
            1 -
            Math.pow(
                -2 * progress + 2,
                3
            ) / 2
        );
    }

    function startArrowMovement(direction) {
        if (groupWidth <= 0) {
            return;
        }

        const itemStep = getItemStep();

        arrowAnimation = {
            startPosition: positionX,
            targetPosition:
                positionX +
                direction * itemStep,
            startTime: performance.now()
        };
    }

    function updateArrowMovement(currentTime) {
        if (!arrowAnimation) {
            return false;
        }

        const elapsed =
            currentTime -
            arrowAnimation.startTime;

        const progress = Math.min(
            elapsed / arrowAnimationDuration,
            1
        );

        const easedProgress =
            easeInOutCubic(progress);

        positionX =
            arrowAnimation.startPosition +
            (
                arrowAnimation.targetPosition -
                arrowAnimation.startPosition
            ) * easedProgress;

        normalizePosition();
        renderPosition();

        if (progress >= 1) {
            arrowAnimation = null;
        }

        return true;
    }

    function animate(currentTime) {
        /*
         * Limita saltos quando a aba volta do modo inativo.
         */
        const deltaTime = Math.min(
            currentTime - lastFrameTime,
            32
        );

        lastFrameTime = currentTime;

        if (!isDragging) {
            const arrowIsMoving =
                updateArrowMovement(currentTime);

            if (!arrowIsMoving) {
                positionX -=
                    pixelsPerSecond *
                    (deltaTime / 1000);

                normalizePosition();
                renderPosition();
            }
        }

        animationFrameId =
            window.requestAnimationFrame(animate);
    }

    previousButton.addEventListener(
        "click",
        () => {
            startArrowMovement(1);
        }
    );

    nextButton.addEventListener(
        "click",
        () => {
            startArrowMovement(-1);
        }
    );

    viewport.addEventListener(
        "pointerdown",
        (event) => {
            isDragging = true;
            arrowAnimation = null;

            pointerStartX = event.clientX;
            positionAtDragStart = positionX;

            viewport.classList.add(
                "is-dragging"
            );

            viewport.setPointerCapture(
                event.pointerId
            );
        }
    );

    viewport.addEventListener(
        "pointermove",
        (event) => {
            if (!isDragging) {
                return;
            }

            const movementX =
                event.clientX -
                pointerStartX;

            positionX =
                positionAtDragStart +
                movementX;

            normalizePosition();
            renderPosition();
        }
    );

    function finishDragging(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;

        viewport.classList.remove(
            "is-dragging"
        );

        if (
            event &&
            event.pointerId !== undefined &&
            viewport.hasPointerCapture(
                event.pointerId
            )
        ) {
            viewport.releasePointerCapture(
                event.pointerId
            );
        }

        lastFrameTime = performance.now();
    }

    viewport.addEventListener(
        "pointerup",
        finishDragging
    );

    viewport.addEventListener(
        "pointercancel",
        finishDragging
    );

    viewport.addEventListener(
        "lostpointercapture",
        () => {
            isDragging = false;

            viewport.classList.remove(
                "is-dragging"
            );

            lastFrameTime =
                performance.now();
        }
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            lastFrameTime = performance.now();
        }
    );

    window.addEventListener(
        "resize",
        () => {
            window.clearTimeout(resizeTimer);

            resizeTimer = window.setTimeout(
                () => {
                    const previousProgress =
                        groupWidth > 0
                            ? Math.abs(positionX) /
                                groupWidth
                            : 0;

                    calculateGroupWidth();

                    positionX =
                        -previousProgress *
                        groupWidth;

                    normalizePosition();
                    renderPosition();

                    lastFrameTime =
                        performance.now();
                },
                150
            );
        }
    );

    waitForImages().then(() => {
        calculateGroupWidth();

        positionX = 0;

        normalizePosition();
        renderPosition();

        lastFrameTime = performance.now();

        if (animationFrameId !== null) {
            window.cancelAnimationFrame(
                animationFrameId
            );
        }

        animationFrameId =
            window.requestAnimationFrame(animate);
    });
});