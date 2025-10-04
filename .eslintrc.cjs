module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/components/ui",
            message:
              "Import specific primitives, not the barrel. Use '@/components/ui/button' instead of '@/components/ui'.",
          },
        ],
      },
    ],
  },
};
