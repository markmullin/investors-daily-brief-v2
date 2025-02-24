export const getRelationshipTooltip = (type, relationship) => {
  const baseTooltips = {
    industry: {
      correlation: "Shows how different industries move in relation to each other",
      supplyChain: "Indicates dependencies between industries in the supply chain",
      economic: "Describes how economic cycles affect this industry",
      risk: "Highlights key risk factors affecting industry performance"
    },
    macro: {
      leading: "Indicators that typically change before the economy as a whole changes",
      lagging: "Indicators that typically change after the economy as a whole changes",
      impact: "Direct effects on market sectors and industry groups",
      policy: "Potential monetary and fiscal policy implications"
    }
  };

  // Match the relationship with the appropriate tooltip
  const tooltipKey = Object.keys(baseTooltips[type]).find(key => 
    relationship.toLowerCase().includes(key)
  );

  return tooltipKey ? baseTooltips[type][tooltipKey] : "Additional market insight";
};