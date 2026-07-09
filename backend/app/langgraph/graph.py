from langgraph.graph import StateGraph, START, END
from app.langgraph.state import AgentState
from app.langgraph.nodes import (
    weather_node,
    alert_node,
    infrastructure_node,
    route_node,
    coordinator_node,
)


def build_graph() -> StateGraph:
    builder = StateGraph(AgentState)

    builder.add_node("weather", weather_node)
    builder.add_node("alert", alert_node)
    builder.add_node("infrastructure", infrastructure_node)
    builder.add_node("route", route_node)
    builder.add_node("coordinator", coordinator_node)

    builder.add_edge(START, "weather")
    builder.add_edge("weather", "alert")
    builder.add_edge("alert", "infrastructure")
    builder.add_edge("infrastructure", "route")
    builder.add_edge("route", "coordinator")
    builder.add_edge("coordinator", END)

    return builder.compile()


graph = build_graph()
