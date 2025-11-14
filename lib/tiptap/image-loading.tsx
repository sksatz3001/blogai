import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

const ImageLoadingComponent = () => {
  return (
    <NodeViewWrapper className="image-loading-wrapper">
      <div className="image-loading-container inline-block my-4 max-w-md mx-auto p-8 glass rounded-xl border-2 border-dashed border-[#88C0D0]">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-[#434C5E] rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#88C0D0] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[#ECEFF4] mb-1">
              Generating Image...
            </p>
            <p className="text-sm text-[#88C0D0]">
              AI is creating your masterpiece
            </p>
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-[#88C0D0] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-2 h-2 bg-[#D08770] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-2 h-2 bg-[#B48EAD] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const ImageLoading = Node.create({
  name: "imageLoading",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-type='image-loading']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "image-loading" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageLoadingComponent);
  },
});
