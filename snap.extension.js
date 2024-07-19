/**
 * JavaScript to extend the configuration of the TPP_SNAP library used for FirstSpirit ContentCreator.
 */

"use strict";

/**
 * Listen for custom events emitted by Lightning Web Component rendering FirstSpirit content to
 * pass the preview ID to the TPP_SNAP library. Required for ContentCreator workflows.
 */
document.addEventListener("sto_com_fs_content_loaded", (event) => {
  if (
    typeof TPP_SNAP !== "undefined" &&
    event.detail &&
    event.detail.previewId
  ) {
    TPP_SNAP.setPreviewElement(event.detail.previewId);
  }
});

/**
 * Register custom editing buttons for FirstSpirit Live Editor to support moving sections.
 */
if (typeof TPP_SNAP !== "undefined") {
  // trigger cache clean reload
  TPP_SNAP.onRerenderView(() => location.reload(true));

  const findFsSections = async ($container) => {
    const previewElements = Array.from(
      $container.querySelectorAll("[data-preview-id]")
    );
    const previewStatuses = await Promise.all(
      previewElements.map(($el) =>
        TPP_SNAP.getElementStatus($el.dataset.previewId)
      )
    );
    return previewElements
      .map(($el, i) => ({
        $el,
        status: previewStatuses[i],
        previewId: $el.dataset.previewId,
      }))
      .filter(({ status }) => status.elementType === "Section");
  };

  // Custom Button: Move Section Up
  TPP_SNAP.registerButton({
    css: "tpp-icon-arrow-up",
    getIcon: function ({ $button }) {
      if (TPP_SNAP.isLegacyCC) $button.innerText = "⇧";
      else $button.classList.add(this.css);
    },
    isVisible: ({ status }) =>
      status.custom === null && status.elementType === "Section",
    isEnabled: async ({ $node }) => {
      const siblings = await findFsSections($node.parentNode);
      const index = siblings.findIndex(({ $el }) => $el === $node);
      return index > 0;
    },
    execute: async ({ $node, status }) => {
      const siblings = await findFsSections($node.parentNode);
      const index = siblings.findIndex(({ $el }) => $el === $node);

      const success = await TPP_SNAP.execute("script:tpp_move_section", {
        sectionId: status.id,
        pos: "" + (index - 1),
      });

      if (success)
        $node.parentNode.insertBefore($node, siblings[index - 1].$el);
    },
  });

  // Custom Button: Move Section Down
  TPP_SNAP.registerButton({
    css: "tpp-icon-arrow-down",
    getIcon: function ({ $button }) {
      if (TPP_SNAP.isLegacyCC) $button.innerText = "⇩";
      else $button.classList.add(this.css);
    },
    isVisible: ({ status }) =>
      status.custom === null && status.elementType === "Section",
    isEnabled: async ({ $node }) => {
      const siblings = await findFsSections($node.parentNode);
      const index = siblings.findIndex(({ $el }) => $el === $node);
      return index !== siblings.length - 1;
    },
    execute: async ({ $node, status }) => {
      const siblings = await findFsSections($node.parentNode);
      const index = siblings.findIndex(({ $el }) => $el === $node);

      const success = await TPP_SNAP.execute("script:tpp_move_section", {
        sectionId: status.id,
        pos: "" + (index + 2),
      });

      if (success)
        siblings[index + 1].$el.insertAdjacentElement("afterend", $node);
    },
  });

  // deactivate default 'move' button due to incompatibility in SF frontend
  TPP_SNAP.overrideDefaultButton("move", {
    isVisible: () => false,
    isEnabled: () => false,
  });

  // reload frontend after default 'workflows' button execution to update page status
  TPP_SNAP.overrideDefaultButton("workflows", {
    afterExecute: async () => {
      location.reload(true);
    },
  });

  // ContentCreator browsing - 28.07.2020
  TPP_SNAP.onRequestPreviewElement(async (previewId) => {
    // map page attribute to SF community page identifier
    try {
      const json = await TPP_SNAP.renderElement(previewId);
      const urlIdentifier = json.formData.pt_sfIdentifier.value;
      //history.pushState(json.uid, json.displayName, json.uid);
      await TPP_SNAP.setPreviewElement(previewId);
      // get URL prefix by project settings
      if (urlIdentifier == "/") {
        window.location.href = await TPP_SNAP.previewUrl();
      } else if (urlIdentifier != null) {
        window.location.href = (await TPP_SNAP.previewUrl()) + urlIdentifier;
      } else {
        location.reload(true);
      }
    } catch (e) {
      console.error(e);
    }
  });
  // end TTP_SNAP
}