from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import Product, User
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=list[ProductRead])
async def list_products(
    q: str | None = Query(default=None, alias="search"),
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProductRead]:
    stmt = select(Product).where(Product.user_id == current_user.id)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(Product.name.ilike(like) | Product.category.ilike(like))
    stmt = stmt.order_by(Product.name.asc())
    result = await session.execute(stmt)
    products = result.scalars().all()
    return [
        ProductRead(
            id=prod.id,
            name=prod.name,
            price=float(prod.price),
            stock=float(prod.stock),
            min_stock=float(prod.min_stock) if prod.min_stock is not None else None,
            description=prod.description,
            category=prod.category,
            type=prod.type,
            created_at=prod.created_at,
            updated_at=prod.updated_at,
        )
        for prod in products
    ]


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
async def create_product(
    payload: ProductCreate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductRead:
    product = Product(
        user_id=current_user.id,
        name=payload.name,
        price=payload.price,
        stock=payload.stock,
        min_stock=payload.min_stock,
        description=payload.description,
        category=payload.category,
        type=payload.type,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return ProductRead(
        id=product.id,
        name=product.name,
        price=float(product.price),
        stock=float(product.stock),
        min_stock=float(product.min_stock) if product.min_stock is not None else None,
        description=product.description,
        category=product.category,
        type=product.type,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


async def _get_product(session: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID) -> Product | None:
    result = await session.execute(
        select(Product).where(Product.id == product_id, Product.user_id == user_id)
    )
    return result.scalar_one_or_none()


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID,
    payload: ProductUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProductRead:
    product = await _get_product(session, current_user.id, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")

    values = {}
    if payload.name is not None:
        values[Product.name] = payload.name
    if payload.price is not None:
        values[Product.price] = payload.price
    if payload.stock is not None:
        values[Product.stock] = payload.stock
    if payload.min_stock is not None:
        values[Product.min_stock] = payload.min_stock
    if payload.description is not None:
        values[Product.description] = payload.description
    if payload.category is not None:
        values[Product.category] = payload.category
    if payload.type is not None:
        values[Product.type] = payload.type
    if values:
        values[Product.updated_at] = datetime.now(timezone.utc)
        await session.execute(update(Product).where(Product.id == product_id).values(values))
        await session.commit()
        await session.refresh(product)

    return ProductRead(
        id=product.id,
        name=product.name,
        price=float(product.price),
        stock=float(product.stock),
        min_stock=float(product.min_stock) if product.min_stock is not None else None,
        description=product.description,
        category=product.category,
        type=product.type,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: uuid.UUID,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    result = await session.execute(
        delete(Product).where(Product.id == product_id, Product.user_id == current_user.id)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    await session.commit()
