from fastapi import HTTPException, status


class BookStoreException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundException(BookStoreException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            detail=f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class UnauthorizedException(BookStoreException):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenException(BookStoreException):
    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_403_FORBIDDEN
        )


class ConflictException(BookStoreException):
    def __init__(self, detail: str = "Resource already exists"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_409_CONFLICT
        )


class BadRequestException(BookStoreException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_400_BAD_REQUEST
        )


class InsufficientStockException(BookStoreException):
    def __init__(self, book_title: str = "Book"):
        super().__init__(
            detail=f"Insufficient stock for {book_title}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


class PaymentException(BookStoreException):
    def __init__(self, detail: str = "Payment processing failed"):
        super().__init__(
            detail=detail,
            status_code=status.HTTP_402_PAYMENT_REQUIRED
        )
