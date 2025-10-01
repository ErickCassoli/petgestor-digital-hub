from __future__ import annotations

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Product, Sale, SaleItem, SaleItemType, SaleType, Service, User
from app.schemas.sale import SaleCreate, SaleDetail, SaleItemRead, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


def _sale_to_read(sale: Sale) -> SaleRead:
    client_data = None
    if sale.client:
        client_data = {"id": sale.client.id, "name": sale.client.name}
    return SaleRead(
        id=sale.id,
        user_id=sale.user_id,
        client_id=sale.client_id,
        client_name=sale.client_name,
        sale_date=sale.sale_date,
        subtotal=float(sale.subtotal),
        discount=float(sale.discount),
        surcharge=float(sale.surcharge),
        total=float(sale.total),
        type=sale.type.value,
        payment_method=sale.payment_method,
        notes=sale.notes,
        created_at=sale.created_at,
        updated_at=sale.updated_at,
        client=client_data,
    )


def _sale_to_detail(sale: Sale) -> SaleDetail:
    base = _sale_to_read(sale)
    items = [
        SaleItemRead(
            id=item.id,
            type=item.type.value,
            product_id=item.product_id,
            service_id=item.service_id,
            name=item.name,
            price=float(item.price),
            quantity=float(item.quantity),
            total=float(item.total),
            discount=float(item.discount),
            surcharge=float(item.surcharge),
        )
        for item in sale.items
    ]
    return SaleDetail(**base.dict(), items=items)  # type: ignore[arg-type]


@router.get("/", response_model=list[SaleRead])
async def list_sales(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SaleRead]:
    result = await session.execute(
        select(Sale)
        .where(Sale.user_id == current_user.id)
        .options(selectinload(Sale.client))
        .order_by(Sale.sale_date.desc())
    )
    sales = result.scalars().all()
    return [_sale_to_read(sale) for sale in sales]


@router.get("/{sale_id}", response_model=SaleDetail)
async def get_sale(
    sale_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SaleDetail:
    result = await session.execute(
        select(Sale)
        .where(Sale.id == sale_id, Sale.user_id == current_user.id)
        .options(selectinload(Sale.items), selectinload(Sale.client))
    )
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada")
    await session.refresh(sale)
    return _sale_to_detail(sale)


@router.post("/", response_model=SaleDetail, status_code=status.HTTP_201_CREATED)
async def create_sale(
    payload: SaleCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SaleDetail:
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adicione pelo menos um item")

    product_ids = {item.product_id for item in payload.items if item.type == "product" and item.product_id}
    service_ids = {item.service_id for item in payload.items if item.type == "service" and item.service_id}

    products: dict[uuid.UUID, Product] = {}
    if product_ids:
        result = await session.execute(
            select(Product).where(Product.id.in_(product_ids), Product.user_id == current_user.id)
        )
        products = {prod.id: prod for prod in result.scalars()}
        missing = product_ids - set(products.keys())
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Produto inválido nos itens")

    services: dict[uuid.UUID, Service] = {}
    if service_ids:
        result = await session.execute(
            select(Service).where(Service.id.in_(service_ids), Service.user_id == current_user.id)
        )
        services = {svc.id: svc for svc in result.scalars()}
        missing = service_ids - set(services.keys())
        if missing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Serviço inválido nos itens")

    has_products = any(item.type == "product" for item in payload.items)
    has_services = any(item.type == "service" for item in payload.items)
    sale_type = (
        SaleType.mixed if has_products and has_services else SaleType.product if has_products else SaleType.service
    )

    sale = Sale(
        user_id=current_user.id,
        client_id=payload.client_id,
        client_name=payload.client_name,
        subtotal=payload.subtotal,
        discount=payload.discount,
        surcharge=payload.surcharge,
        total=payload.total,
        type=sale_type,
        payment_method=payload.payment_method,
        notes=payload.notes,
    )
    session.add(sale)
    await session.flush()

    sale_items = []
    for item in payload.items:
        item_type = SaleItemType(item.type)
        product_id = item.product_id if item_type == SaleItemType.product else None
        service_id = item.service_id if item_type == SaleItemType.service else None
        sale_items.append(
            SaleItem(
                sale_id=sale.id,
                type=item_type,
                product_id=product_id,
                service_id=service_id,
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                total=item.total,
                discount=item.discount,
                surcharge=item.surcharge,
            )
        )
        if product_id:
            product = products[product_id]
            new_stock = Decimal(product.stock) - Decimal(item.quantity)
            product.stock = new_stock
    session.add_all(sale_items)
    await session.commit()
    await session.refresh(sale)
    await session.refresh(sale, attribute_names=["items", "client"])
    return _sale_to_detail(sale)


@router.delete("/{sale_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sale(
    sale_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Sale).where(Sale.id == sale_id, Sale.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venda não encontrada")
    await session.commit()
